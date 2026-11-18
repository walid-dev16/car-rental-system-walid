import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import API from "../api/api.js";
import ContactPage from "./ContactPage.jsx";

vi.mock("../api/api.js", () => ({ default: { post: vi.fn() } }));

const inquiry = {
  sender_name: "Sample Guest",
  email: "guest@example.test",
  subject: "Pickup time",
  message: "Can I collect the car at 10 am?",
};

function sendInquiry() {
  fireEvent.change(screen.getByLabelText("Full Name"), { target: { value: inquiry.sender_name } });
  fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: inquiry.email } });
  fireEvent.change(screen.getByLabelText("Subject"), { target: { value: inquiry.subject } });
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: inquiry.message } });
  fireEvent.click(screen.getByRole("button", { name: "Send Message" }));
}

vi.mock("../components/home/Navbar.jsx", () => ({
  default: () => <div>Navbar Section</div>,
}));

vi.mock("../components/home/Footer.jsx", () => ({
  default: () => <div>Footer Section</div>,
}));

describe("ContactPage", () => {
  it("renders navbar and footer", () => {
    render(<ContactPage />);

    expect(screen.getByText(/Navbar Section/i)).toBeInTheDocument();
    expect(screen.getByText(/Footer Section/i)).toBeInTheDocument();
  });

  it("renders page heading and intro text", () => {
    render(<ContactPage />);

    expect(screen.getByText(/Contact Us/i)).toBeInTheDocument();
    expect(screen.getByText(/We’re here to help/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Have a question about bookings, cars, pricing, or support/i)
    ).toBeInTheDocument();
  });

  it("renders contact form fields", () => {
    render(<ContactPage />);

    expect(screen.getByPlaceholderText(/Your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/How can we help\?/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write your message here/i)).toBeInTheDocument();
  });

  it("renders send message button", () => {
    render(<ContactPage />);

    expect(screen.getByRole("button", { name: /Send Message/i })).toBeInTheDocument();
  });

  it("renders contact information section", () => {
    render(<ContactPage />);

    expect(screen.getByText(/Contact Information/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the message form" })).toHaveAttribute("href", "#contact-name");
    expect(screen.getByLabelText("Full Name")).toHaveAttribute("id", "contact-name");
    expect(screen.getAllByText(/Erfurt, Germany/i).length).toBeGreaterThan(0);
  });

  it("clears the form only after the office inbox accepts a message", async () => {
    API.post.mockResolvedValueOnce({ data: { message: "Message received." } });
    render(<ContactPage />);
    sendInquiry();
    expect(await screen.findByRole("status")).toHaveTextContent("Message received.");
    expect(API.post).toHaveBeenCalledWith("/contact", inquiry);
    for (const field of ["Full Name", "Email Address", "Subject", "Message"]) {
      expect(screen.getByLabelText(field)).toHaveValue("");
    }
  });

  it("keeps the complete message available to retry when submission fails", async () => {
    API.post.mockRejectedValueOnce(new Error("offline"));
    render(<ContactPage />);
    sendInquiry();
    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again");
    expect(screen.getByLabelText("Full Name")).toHaveValue(inquiry.sender_name);
    expect(screen.getByLabelText("Email Address")).toHaveValue(inquiry.email);
    expect(screen.getByLabelText("Subject")).toHaveValue(inquiry.subject);
    expect(screen.getByLabelText("Message")).toHaveValue(inquiry.message);
    expect(screen.getByRole("button", { name: "Send Message" })).toBeEnabled();
  });

  it("renders working hours", () => {
  render(<ContactPage />);

  expect(screen.getAllByText(/Working Hours/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Monday - Friday/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/08:00 - 18:00/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Saturday/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/10:00 - 16:00/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Sunday/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Closed/i).length).toBeGreaterThan(0);
});

  it("renders quick support section", () => {
    render(<ContactPage />);

    expect(screen.getByText(/Need quick support\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/For urgent booking issues, contact our support team/i)
    ).toBeInTheDocument();
  });
});