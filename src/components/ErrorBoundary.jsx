import * as React from "react";
import { Trans, withTranslation } from "react-i18next";
import { copyToClipboard } from "../app/utils";

/* eslint-disable jsx-a11y/control-has-associated-label, jsx-a11y/anchor-has-content -- Trans supplies the localized link text. */
class ErrorBoundaryImpl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      stack: null,
      unsupportedIndexedDB: false,
    };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Error caught", error, info);

    // Special case for unsupported IndexedDB in Private Browsing mode (Firefox, Safari), see
    // - https://github.com/dexie/Dexie.js/issues/312
    // - https://bugzilla.mozilla.org/show_bug.cgi?id=781982
    const isUnsupportedIndexedDB =
      error?.name === "InvalidStateError" || (error?.name === "DatabaseClosedError" && error?.message?.indexOf("InvalidStateError") !== -1);

    if (isUnsupportedIndexedDB) {
      this.handleUnsupportedIndexedDB();
    } else {
      this.handleError(error, info);
    }
  }

  handleError(error, info) {
    const componentStack = info.componentStack
      .trim()
      .split("\n")
      .map((line) => `  at ${line}`)
      .join("\n");
    const parts = [error.toString()];
    if (error.stack) parts.push(error.stack);
    parts.push(componentStack);
    this.setState({
      error: true,
      stack: parts.join("\n"),
    });
  }

  handleUnsupportedIndexedDB() {
    this.setState({
      error: true,
      unsupportedIndexedDB: true,
    });
  }

  copyStack() {
    copyToClipboard(`${this.state.stack}\n`);
  }

  renderUnsupportedIndexedDB() {
    const { t } = this.props;
    return (
      <div className="m-5">
        <h2>{t("error_boundary_unsupported_indexeddb_title")} 😮</h2>
        <p className="max-w-xl">
          <Trans
            i18nKey="error_boundary_unsupported_indexeddb_description"
            components={{
              githubLink: <a href="https://github.com/binwiederhier/ntfy/issues/208" target="_blank" rel="noopener noreferrer" />,
              discordLink: <a href="https://discord.gg/cT7ECsZj9w" target="_blank" rel="noopener noreferrer" />,
              matrixLink: <a href="https://matrix.to/#/#ntfy:matrix.org" target="_blank" rel="noopener noreferrer" />,
            }}
          />
        </p>
      </div>
    );
  }

  renderError() {
    const { t } = this.props;
    return (
      <div className="m-5">
        <h2>{t("error_boundary_title")} 😮</h2>
        <p>
          <Trans
            i18nKey="error_boundary_description"
            components={{
              githubLink: <a href="https://github.com/binwiederhier/ntfy/issues" target="_blank" rel="noopener noreferrer" />,
              discordLink: <a href="https://discord.gg/cT7ECsZj9w" target="_blank" rel="noopener noreferrer" />,
              matrixLink: <a href="https://matrix.to/#/#ntfy:matrix.org" target="_blank" rel="noopener noreferrer" />,
            }}
          />
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            className="border border-control-border rounded-sm px-3 py-2 text-body-sm text-text hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={() => this.copyStack()}
          >
            {t("error_boundary_button_copy_stack_trace")}
          </button>

          <button
            type="button"
            className="border border-control-border rounded-sm px-3 py-2 text-body-sm text-text hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            onClick={() => window.location.reload()}
          >
            {t("error_boundary_button_reload_ntfy")}
          </button>
        </div>
        <h3>{t("error_boundary_stack_trace")}</h3>
        <pre>{this.state.stack}</pre>
      </div>
    );
  }

  render() {
    if (this.state.error) {
      if (this.state.unsupportedIndexedDB) {
        return this.renderUnsupportedIndexedDB();
      }
      return this.renderError();
    }
    return this.props.children;
  }
}

const ErrorBoundary = withTranslation()(ErrorBoundaryImpl); // Adds props.t
export default ErrorBoundary;
