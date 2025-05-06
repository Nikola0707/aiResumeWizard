import { render, screen } from "@testing-library/react";
import ResumesList from "../resumes-list";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

test("renders loading state", () => {
  render(
    <QueryClientProvider client={queryClient}>
      <ResumesList />
    </QueryClientProvider>
  );
  expect(screen.getByText(/Your Resumes/i)).toBeInTheDocument();
});
