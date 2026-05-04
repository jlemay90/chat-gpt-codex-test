import { render, screen } from "@testing-library/react";
import { App } from "../App";

test("shows the address lookup workspace and notes panel", () => {
  render(<App />);
  expect(screen.getByText(/lead intel/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
});
