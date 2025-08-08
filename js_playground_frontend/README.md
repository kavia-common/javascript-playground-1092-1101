# JavaScript Playground Frontend (React)

This is a modern, responsive **interactive JavaScript playground** built with React and Monaco Editor.

## Features

- **Real-time JavaScript code editor** with syntax highlighting (Monaco)
- **Instant code execution**, fully in-browser (sandboxed in iframe)
- **Output/console panel** for showing logs and errors
- **Split layout**: editor (left), output panel (right), controls on top
- **Display of runtime errors**
- **Modern minimalistic style** (light theme, accent colors)
- **Responsive UI** for web and mobile

## Layout

- Top: Controls for "Run", "Reset", and "Clear Output"
- Left: Monaco code editor
- Right: Console/output panel

## How it Works

- Write or edit JS code in the editor
- Click "Run" (or use custom shortcut support)
- Output (console.log, errors, alerts) shows on the right instantly

## Colors & Theme

- Accent: `#ffb300`  
- Primary: `#1976d2`  
- Secondary: `#424242`

## Dev Setup

```
npm install
npm start
```

App will open at [http://localhost:3000](http://localhost:3000)

## Tech Stack

- [React](https://react.dev/)
- [@monaco-editor/react](https://github.com/suren-atoyan/monaco-react)

---
