import React from "react";
import { createRoot } from "react-dom/client";
import { AppProvider } from "./state/store";
import App from "./app/App";
import { AccountProvider } from './features/account/AccountProvider';
import { VideoProvider } from './features/video/VideoProvider';
import { VideoSearchProvider } from './features/video-search/VideoSearchProvider';
import { HistoryProvider } from './features/history/HistoryProvider';
import './styles/account.css';
import './styles/bilibili-player.css';
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/conversation.css";
import "./styles/pages.css";
import "./styles/workspace.css";
import "./styles/desktop.css";
import "./styles/activity.css";
import "./styles/video.css";
import "./styles/chat-layout.css";
import "./styles/diff-accordion.css";
import "./styles/composer-controls.css";
import "./styles/thread-resources.css";
import './styles/video-search.css';
import './styles/history.css';
createRoot(document.getElementById("root")!).render(
  <AppProvider>
    <AccountProvider><VideoProvider><HistoryProvider><VideoSearchProvider><App /></VideoSearchProvider></HistoryProvider></VideoProvider></AccountProvider>
  </AppProvider>,
);
