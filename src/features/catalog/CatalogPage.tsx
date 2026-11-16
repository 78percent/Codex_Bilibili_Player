import { useState } from "react";
import { useApp, useNotify } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Markdown } from "../conversation/Markdown";
import { catalog } from "./data";
export function CatalogPage({ kind }: any) {
  const { state, dispatch } = useApp();
  const notify = useNotify();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("全部");
  const [detail, setDetail] = useState<any>(null);
  const skills = kind === "skills";
  const list = catalog.slice(skills ? 0 : 6, skills ? 6 : undefined);
  const active = skills ? state.installed : state.connected;
  const action = (item: any) => {
    dispatch({ type: skills ? "INSTALL" : "CONNECT", id: item.id });
    notify(
      active.includes(item.id)
        ? skills
          ? "技能已移除"
          : "已断开连接"
        : skills
          ? "技能已安装"
          : "已连接",
    );
  };
  return (
    <div className="page-scroll">
      <div className="page-container">
        <div className="page-heading">
          <h1>{skills ? "技能" : "应用"}</h1>
          <Button
            icon="Plus"
            onClick={() => {
              setDetail({
                id: crypto.randomUUID(),
                name: skills ? "自定义技能" : "自定义连接",
                description: "",
                body: skills
                  ? "# 自定义技能\n\n在下方填写技能名称与说明。"
                  : "# 自定义连接\n\n创建本地连接条目。",
                author: "Local",
                icon: "Plus",
                custom: true,
              });
            }}
          >
            {skills ? "创建技能" : "添加连接"}
          </Button>
        </div>
        <div className="catalog-toolbar">
          <div className="search-input">
            <Icon name="Search" size={17} />
            <input
              placeholder={skills ? "搜索技能" : "搜索应用"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="project-tabs">
            {["全部", skills ? "已安装" : "已连接", "开发", "文档", "数据"].map(
              (f) => (
                <button
                  key={f}
                  className={f === filter ? "selected" : ""}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ),
            )}
          </div>
        </div>
        <div className="catalog-grid">
          {list
            .filter(
              (item) =>
                (item.name + " " + item.description)
                  .toLowerCase()
                  .includes(query.toLowerCase()) &&
                (filter === "全部" || filter === "已安装" || filter === "已连接"
                  ? filter === "全部" || active.includes(item.id)
                  : item.category === filter),
            )
            .map((item) => (
              <button
                className="catalog-card"
                key={item.id}
                onClick={() => setDetail(item)}
              >
                <span className={`catalog-icon ${item.id}`}>
                  <Icon name={item.icon} size={25} />
                </span>
                <div>
                  <h3>
                    {item.name}
                    {active.includes(item.id) && (
                      <Icon name="CircleCheck" size={15} />
                    )}
                  </h3>
                  <p>{item.description}</p>
                  <small>{item.author}</small>
                </div>
                <Icon name="ChevronRight" size={16} />
              </button>
            ))}
        </div>
        {(state.settings[`${kind}-custom`] || []).map((item: any) => (
          <button
            className="custom-catalog-row"
            key={item.id}
            onClick={() => setDetail(item)}
          >
            <Icon name="Puzzle" size={20} />
            {item.name}
            <span className="chip">本地</span>
          </button>
        ))}
      </div>
      {detail && (
        <Dialog title={detail.name} onClose={() => setDetail(null)} wide>
          <div className="catalog-detail">
            <div className="detail-brand">
              <span className="catalog-icon">
                <Icon name={detail.icon || "Puzzle"} size={32} />
              </span>
              <div>
                <h2>{detail.name}</h2>
                <span>{detail.author}</span>
              </div>
              <span className="spacer" />
              {!detail.custom && (
                <Button
                  variant={active.includes(detail.id) ? "secondary" : "primary"}
                  onClick={() => action(detail)}
                >
                  {active.includes(detail.id)
                    ? skills
                      ? "移除"
                      : "断开连接"
                    : skills
                      ? "安装"
                      : "连接"}
                </Button>
              )}
            </div>
            <Markdown text={detail.body} />
            {detail.custom && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  const item = {
                    ...detail,
                    name: String(data.get("name")),
                    body: String(data.get("body")),
                    custom: false,
                  };
                  dispatch({
                    type: "SETTINGS",
                    value: {
                      [`${kind}-custom`]: [
                        ...(state.settings[`${kind}-custom`] || []),
                        item,
                      ],
                    },
                  });
                  setDetail(null);
                }}
              >
                <label className="field">
                  名称
                  <input name="name" required />
                </label>
                <label className="field">
                  说明
                  <textarea name="body" rows={4} />
                </label>
                <Button variant="primary">创建</Button>
              </form>
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
