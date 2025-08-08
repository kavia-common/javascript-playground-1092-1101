import React, { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import "./App.css";

/**
 * PUBLIC_INTERFACE
 * JavaScript Playground App
 * - Realtime code editor (Monaco) on left
 * - Instant run (eval in iframe) & console right
 * - Controls (Run/Reset/Clear Output) on top
 * - Color palette: { accent: #ffb300, primary: #1976d2, secondary: #424242 }
 * - Responsive, modern, light, minimal
 */
function App() {
  // Default JS starter code
  const DEFAULT_CODE = `// Welcome to JS Playground!
// Type your JavaScript code below and click Run.
// You can use console.log(), alert(), etc.

function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("World");
`;

  const [code, setCode] = useState(DEFAULT_CODE);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [error, setError] = useState(null);
  const [editorMounted, setEditorMounted] = useState(false);

  // For accessing the editor instance
  const editorRef = useRef(null);

  // Handler for code change in Monaco
  const handleEditorChange = (value) => {
    setCode(value);
    setError(null);
  };

  // PUBLIC_INTERFACE
  // Run JS code using a sandboxed iframe, capture console logs/errors
  const runCode = () => {
    setConsoleOutput([]);
    setError(null);

    // Create iframe dynamically for sandboxed code exec
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.sandbox = "allow-scripts";
    document.body.appendChild(iframe);

    let capturedLogs = [];
    // Provide replacement for console.log, console.error, alert, etc. within iframe
    const scriptText = `
      window.console = {
        log: function(...args) {
          parent.postMessage({ source: 'jsplayground', type: 'log', args }, '*');
        },
        error: function(...args) {
          parent.postMessage({ source: 'jsplayground', type: 'error', args }, '*');
        }
      };
      window.alert = function(...args) {
        parent.postMessage({ source: 'jsplayground', type: 'alert', args }, '*');
      };
      try {
        ${code}
      } catch (err) {
        window.console.error(err && err.toString ? err.toString() : String(err));
      }
    `;

    // Listen for output from iframe
    function messageHandler(event) {
      if (
        event.data &&
        event.data.source === "jsplayground" &&
        ["log", "error", "alert"].includes(event.data.type)
      ) {
        if (event.data.type === "log") {
          capturedLogs.push({ type: "log", value: event.data.args.join(" ") });
        } else if (event.data.type === "error") {
          capturedLogs.push({ type: "error", value: event.data.args.join(" ") });
        } else if (event.data.type === "alert") {
          capturedLogs.push({ type: "alert", value: event.data.args.join(" ") });
        }
        setConsoleOutput([...capturedLogs]);
      }
    }

    window.addEventListener("message", messageHandler);

    // Run the code
    // Defensive: Ensure iframe and its contentDocument/body exist before accessing them.
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc && doc.body) {
        let script = doc.createElement("script");
        script.type = "text/javascript";
        script.textContent = scriptText;
        doc.body.appendChild(script);
      } else {
        // Could not access iframe document body, post message as error to user
        setError("Sandboxed iframe for code execution failed to initialize. Please try again.");
      }
    } catch (err) {
      setError("Failed to run code: " + (err && err.toString ? err.toString() : String(err)));
    }

    // Remove listener and iframe after some ms
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
      } catch {
        /* Already removed or never added, ignore */
      }
      window.removeEventListener("message", messageHandler);
    }, 100);

    // Note: Errors thrown asynchronously won't always appear here
  };

  // Reset editor to default code
  const resetCode = () => {
    setCode(DEFAULT_CODE);
    setError(null);
    setConsoleOutput([]);
  };

  // Clear output panel
  const clearConsole = () => {
    setConsoleOutput([]);
    setError(null);
  };

  // Renderers for console output
  const renderConsole = () => (
    <div className="console-output" aria-label="Output console panel" tabIndex="0">
      {consoleOutput.length === 0 ? (
        <div className="console-placeholder">Output and logs will appear here.</div>
      ) : (
        consoleOutput.map((line, idx) => (
          <div
            key={idx}
            className={
              line.type === "error"
                ? "console-error"
                : line.type === "alert"
                ? "console-alert"
                : "console-log"
            }
          >
            {line.value}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="playground-root">
      {/* Controls bar */}
      <header className="playground-header">
        <span className="playground-title">
          <span className="brand-accent">JS Playground</span>
        </span>
        <div className="controls-group">
          <button className="btn primary" onClick={runCode}>
            ▶ Run
          </button>
          <button className="btn secondary" onClick={resetCode}>
            Reset
          </button>
          <button className="btn accent" onClick={clearConsole}>
            Clear Output
          </button>
        </div>
      </header>

      {/* Main content split: editor left, console right */}
      <main className="split-layout">
        {/* Editor Panel */}
        <section className="editor-section" aria-label="Code editor panel">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={handleEditorChange}
            theme="light"
            options={{
              fontFamily: "'Fira Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
              fontSize: 15,
              minimap: { enabled: false },
              wordWrap: "on",
              lineNumbers: "on",
              automaticLayout: true,
            }}
            onMount={(editor) => {
              editorRef.current = editor;
              setEditorMounted(true);
            }}
          />
        </section>

        {/* Console/Output Panel */}
        <section className="console-section">
          <div className="console-header">Output / Console</div>
          {error && (
            <div className="error-notice">
              <strong>Error:</strong> {error}
            </div>
          )}
          {renderConsole()}
        </section>
      </main>
      <footer className="footer-note">
        Powered by <a href="https://react.dev/" target="_blank" rel="noopener noreferrer">React</a> & Monaco Editor &middot;{" "}
        <span style={{ color: "var(--accent)" }}>Try console.log("Hi!");</span>
      </footer>
    </div>
  );
}

export default App;
