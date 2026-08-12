import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "./Register";
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

describe("Register page", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects passwords shorter than 8 characters without calling register()", async () => {
    const register = vi.fn();
    mockAuth({ register });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
    await user.type(screen.getByLabelText("パスワード（8文字以上）"), "short1");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(
      await screen.findByText("パスワードは8文字以上で入力してください。"),
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("registers and shows the passkey opt-in when supported", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    mockAuth({ register, passkeySupported: true });
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
    await user.type(screen.getByLabelText("パスワード（8文字以上）"), "password123");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith("test@example.com", "password123"),
    );
    expect(await screen.findByText("登録が完了しました")).toBeInTheDocument();
    expect(screen.getByText(/パスキーを追加登録する/)).toBeInTheDocument();
  });
});
