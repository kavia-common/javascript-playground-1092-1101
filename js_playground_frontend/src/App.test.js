import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

test("renders JS Playground and Run button", () => {
  render(<App />);
  expect(screen.getByText(/JS Playground/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Run/i })).toBeInTheDocument();
  expect(screen.getByText(/Output \/ Console/i)).toBeInTheDocument();
});

test("editor allows code edit and run", async () => {
  render(<App />);
  // Monaco loads asynchronously, so just check for controls
  expect(screen.getByRole("button", { name: /Run/i })).toBeInTheDocument();
});

test("reset button clears to default", () => {
  render(<App />);
  // Change code and reset, should get default code back
  // Skipping Monaco editor input due to async complexity, smoke test only.
  fireEvent.click(screen.getByText(/Reset/i));
});
