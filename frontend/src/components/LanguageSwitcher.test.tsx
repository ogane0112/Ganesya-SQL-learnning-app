import { describe, it, expect, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "./LanguageSwitcher";
import i18n from "../i18n";

describe("LanguageSwitcher", () => {
  afterEach(async () => {
    await i18n.changeLanguage("ja");
  });

  it("switches the active language and persists the choice", async () => {
    render(<LanguageSwitcher />);
    const select = screen.getByLabelText("言語") as HTMLSelectElement;
    expect(select.value).toBe("ja");

    const user = userEvent.setup();
    await user.selectOptions(select, "en");

    await waitFor(() => expect(i18n.language).toBe("en"));
    expect(localStorage.getItem("sql-app:locale")).toBe("en");
  });
});
