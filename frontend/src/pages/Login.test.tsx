import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import * as AuthContextModule from "../context/AuthContext";

function mockAuth(overrides: Partial<ReturnType<typeof AuthContextModule.useAuth>>) {
  vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
    user: null,
    loading: false,
    passkeySupported: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    registerPasskey: vi.fn(),
    loginWithPasskey: vi.fn(),
    ...overrides,
  });
}

describe("Login page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("hides the passkey button on unsupported browsers (要件9.1)", () => {
    mockAuth({ passkeySupported: false });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/パスキーでログイン/)).not.toBeInTheDocument();
  });

  it("shows the passkey button on supported browsers", () => {
    mockAuth({ passkeySupported: true });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    expect(screen.getByText(/パスキーでログイン/)).toBeInTheDocument();
  });

  it("submits email/password to login()", async () => {
    const login = vi.fn().mockResolvedValue(undefined);
    mockAuth({ login });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith("test@example.com", "password123"),
    );
  });

  it("shows an error message when login fails", async () => {
    const login = vi.fn().mockRejectedValue(new Error("failed"));
    mockAuth({ login });
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
    await user.type(screen.getByLabelText("パスワード"), "wrong");
    await user.click(screen.getByRole("button", { name: "ログイン" }));

    expect(await screen.findByText("ログインに失敗しました。")).toBeInTheDocument();
  });
});
