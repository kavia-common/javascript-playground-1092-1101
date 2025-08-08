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
  // Run JS code using a sandboxed, same-origin iframe. 
  // All inter-frame communication is now performed EXCLUSIVELY via postMessage, 
  // removing all cross-origin/cross-frame property access.
  const runCode = () => {
    setConsoleOutput([]);
    setError(null);

    let capturedLogs = [];
    let iframe = null;

    function messageHandler(event) {
      try {
        if (
          event.origin === window.location.origin &&
          event.data &&
          typeof event.data === "object" &&
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
      } catch (securityError) {
        // Catch and ignore any SecurityError (shouldn't happen with postMessage-only approach)
      }
    }

    window.addEventListener("message", messageHandler);

    // srcdoc HTML for the sandboxed iframe to listen for code and run it
    const runnerHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body>
          <script>
            // Disable parent access
            window.parent = null;
            window.top = window;
            // Only listen for messages from same origin parent
            window.addEventListener('message', function(event) {
              try {
                if (event.origin !== window.location.origin) return;
                if (!event.data || typeof event.data !== 'object' || event.data.source !== 'jsplayground' || event.data.type !== 'run') return;
                // Custom console, only postMessage out
                function send(type, ...args) {
                  try {
                    window.top.postMessage(
                      { source: 'jsplayground', type, args },
                      window.location.origin || '*'
                    );
                  } catch(e) {}
                }
                window.console = {
                  log: (...args) => send('log', ...args),
                  error: (...args) => send('error', ...args)
                };
                window.alert = (...args) => send('alert', ...args);

                try {
                  eval(event.data.payload);
                } catch (err) {
                  window.console.error(err && err.toString ? err.toString() : String(err));
                }
              } catch (e) {
                // ignore
              }
            });
            // Notify parent we're ready (optional).
            window.top.postMessage({ source: 'jsplayground', type: 'ready' }, window.location.origin || '*');
          </script>
        </body>
      </html>
    `;

    // Clean up any existing iframe
    // (Not strictly necessary, but in case runCode is called rapidly)
    const existing = document.getElementById("playground-runner-iframe");
    if (existing) {
      try { existing.remove(); } catch {}
    }

    // Create/attach hidden sandboxed iframe
    iframe = document.createElement("iframe");
    iframe.id = "playground-runner-iframe";
    iframe.style.display = "none";
    iframe.sandbox = "allow-scripts"; // no allow-same-origin
    iframe.srcdoc = runnerHTML;
    document.body.appendChild(iframe);

    // Send the code to the sandbox via postMessage as soon as it loads
    function sendCodeToIframe() {
      try {
        // Always use postMessage, never touch any iframe properties
        iframe.contentWindow.postMessage(
          { source: "jsplayground", type: "run", payload: code },
          window.location.origin
        );
      } catch (err) {
        setError("Failed to communicate with runner iframe (postMessage): " + (err && err.toString ? err.toString() : String(err)));
      }
    }

    // Set up a listener to send code as soon as the iframe is ready
    let ready = false;
    function tempReadyHandler(event) {
      try {
        if (
          event.source === iframe.contentWindow &&
          event.origin === window.location.origin &&
          event.data &&
          typeof event.data === "object" &&
          event.data.source === "jsplayground" &&
          event.data.type === "ready"
        ) {
          ready = true;
          sendCodeToIframe();
          window.removeEventListener("message", tempReadyHandler);
        }
      } catch {}
    }
    window.addEventListener("message", tempReadyHandler);

    // Fallback: send code after a short delay if ready was not received (iframe loads fast in practice)
    setTimeout(function(){
      if (!ready) sendCodeToIframe();
    }, 30);

    // Cleanup: Remove iframe and listeners after short time
    setTimeout(() => {
      try {
        if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      } catch {}
      window.removeEventListener("message", messageHandler);
      window.removeEventListener("message", tempReadyHandler);
    }, 200); // a bit longer to catch async logs
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
