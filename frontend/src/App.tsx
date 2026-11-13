import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChartColumn,
  ChevronDown,
  CircleHelp,
  Copy,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MousePointerClick,
  Pencil,
  Plus,
  Power,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./index.css";

type Language = "fa" | "en";
type AnalyticsDays = 7 | 30;

interface AppProps {
  onLogout: () => void;
}

interface DashboardLink {
  id: string;
  originalUrl: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  shortUrl: string;
  clicks: number;
}

interface LinksResponse {
  success: boolean;
  message?: string;
  links?: DashboardLink[];
}

interface LinkResponse {
  success: boolean;
  message?: string;
  link?: DashboardLink;
}

interface AnalyticsResponse {
  success: boolean;
  days: number;
  totalClicks: number;
  daily: {
    date: string;
    clicks: number;
  }[];
}

const API_BASE_URL = "http://127.0.0.1:3000/api";

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "ارتباط با سرور برقرار نشد. مطمئن شوید بک‌اند در حال اجراست.",
    );
  }

  const data = (await response.json()) as T & {
    success?: boolean;
    message?: string;
  };

  if (!response.ok || !data.success) {
    throw new Error(data.message || "درخواست ناموفق بود.");
  }

  return data;
}

function getDestination(url: string): string {
  try {
    const parsed = new URL(url);

    return `${parsed.hostname}${
      parsed.pathname === "/" ? "" : parsed.pathname
    }`;
  } catch {
    return url;
  }
}

function formatDate(value: string, isFa: boolean): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(isFa ? "fa-IR" : "en-US");
}

function App({ onLogout }: AppProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage =
    location.pathname === "/"
      ? "dashboard"
      : location.pathname.replace(/^\/+|\/+$/g, "");

  const validPages = [
    "dashboard",
    "links",
    "analytics",
    "settings",
    "help",
  ];

  useEffect(() => {
    if (!validPages.includes(currentPage)) {
      navigate("/", { replace: true });
    }
  }, [currentPage, navigate]);

  const [language, setLanguage] = useState<Language>("fa");
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [originalUrl, setOriginalUrl] = useState("");
  const [links, setLinks] = useState<DashboardLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [creating, setCreating] = useState(false);

  const [editingLink, setEditingLink] =
    useState<DashboardLink | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [busyLinkId, setBusyLinkId] = useState<string | null>(null);

  const [analyticsDays, setAnalyticsDays] =
    useState<AnalyticsDays>(7);
  const [analytics, setAnalytics] =
    useState<AnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState(0);

  const isFa = language === "fa";
  const direction = isFa ? "rtl" : "ltr";

  const t = {
    dashboard: isFa ? "داشبورد" : "Dashboard",
    links: isFa ? "لینک‌های من" : "My Links",
    analytics: isFa ? "آمار و تحلیل" : "Analytics",
    settings: isFa ? "تنظیمات" : "Settings",
    help: isFa ? "راهنما و پشتیبانی" : "Help & Support",
    logout: isFa ? "خروج از حساب" : "Log out",
    workspace: isFa ? "فضای کاری شخصی" : "Personal workspace",
    overview: isFa ? "نمای کلی" : "Overview",
    welcome: isFa ? "خوش اومدی!" : "Welcome back!",
    subtitle: isFa
      ? "لینک‌های ذخیره‌شده و عملکرد آن‌ها را از اینجا مدیریت کن."
      : "Manage your saved links and review their performance.",
    create: isFa ? "ساخت لینک جدید" : "Create new link",
    totalLinks: isFa ? "کل لینک‌ها" : "Total links",
    totalClicks: isFa ? "مجموع کلیک‌ها" : "Total clicks",
    avgClicks: isFa
      ? "میانگین کلیک هر لینک"
      : "Average clicks per link",
    activeLinks: isFa ? "لینک‌های فعال" : "Active links",
    compared: isFa ? "اطلاعات واقعی حساب" : "Live account data",
    weekly: isFa ? "کلیک‌های روزانه" : "Daily clicks",
    weeklySub: isFa
      ? "تعداد کلیک‌های ثبت‌شده در هر روز"
      : "Number of clicks recorded each day",
    recent: isFa ? "لینک‌های من" : "My links",
    viewAll: isFa ? "مشاهده همه" : "View all",
    shortLink: isFa ? "لینک کوتاه" : "Short link",
    destination: isFa ? "آدرس مقصد" : "Destination",
    clicks: isFa ? "کلیک‌ها" : "Clicks",
    created: isFa ? "تاریخ ساخت" : "Created",
    status: isFa ? "وضعیت" : "Status",
    actions: isFa ? "عملیات" : "Actions",
    search: isFa ? "جست‌وجو..." : "Search...",
    copied: isFa ? "لینک کوتاه کپی شد." : "Short link copied.",
    createTitle: isFa ? "ساخت لینک کوتاه" : "Create a short link",
    original: isFa ? "آدرس اصلی" : "Original URL",
    originalPlaceholder: "https://example.com/page",
    cancel: isFa ? "لغو" : "Cancel",
    createButton: isFa ? "ساخت لینک" : "Create link",
  };

  async function loadLinks(
    showErrors = true,
  ): Promise<boolean> {
    try {
      const result = await apiRequest<LinksResponse>("/links");
      setLinks(result.links ?? []);
      return true;
    } catch (error) {
      if (showErrors) {
        setNotice(
          error instanceof Error
            ? error.message
            : "دریافت لینک‌ها ناموفق بود.",
        );
      }

      return false;
    } finally {
      setLoadingLinks(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const result = await apiRequest<LinksResponse>("/links");

        if (active) {
          setLinks(result.links ?? []);
        }
      } catch (error) {
        if (active) {
          setNotice(
            error instanceof Error
              ? error.message
              : "دریافت لینک‌ها ناموفق بود.",
          );
        }
      } finally {
        if (active) {
          setLoadingLinks(false);
        }
      }
    }

    void initialLoad();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      currentPage !== "analytics" &&
      currentPage !== "dashboard"
    ) {
      return;
    }

    let active = true;

    async function loadAnalytics() {
      setLoadingAnalytics(true);

      try {
        const result = await apiRequest<AnalyticsResponse>(
          `/links/analytics?days=${analyticsDays}`,
        );

        if (active) {
          setAnalytics(result);
        }
      } catch (error) {
        if (active) {
          setNotice(
            error instanceof Error
              ? error.message
              : isFa
                ? "دریافت آمار ناموفق بود."
                : "Failed to load analytics.",
          );
        }
      } finally {
        if (active) {
          setLoadingAnalytics(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [
    currentPage,
    analyticsDays,
    analyticsRefreshKey,
    isFa,
  ]);

  const filteredLinks = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return links;
    }

    return links.filter((link) =>
      `${link.code} ${link.originalUrl} ${getDestination(
        link.originalUrl,
      )}`
        .toLowerCase()
        .includes(query),
    );
  }, [links, search]);

  const totalClicks = links.reduce(
    (total, link) => total + (Number(link.clicks) || 0),
    0,
  );

  const averageClicks = links.length
    ? Math.round(totalClicks / links.length)
    : 0;

  const activeLinks = links.filter(
    (link) => link.isActive,
  ).length;

  const chartData = (analytics?.daily ?? []).map((item) => ({
    day: new Date(`${item.date}T12:00:00Z`).toLocaleDateString(
      isFa ? "fa-IR" : "en-US",
      {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      },
    ),
    clicks: item.clicks,
  }));

  async function copyLink(shortUrl: string) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setNotice(t.copied);
    } catch {
      setNotice(
        isFa
          ? `کپی خودکار ناموفق بود. لینک: ${shortUrl}`
          : `Clipboard access failed. Link: ${shortUrl}`,
      );
    }
  }

  function isValidHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);

      return (
        parsed.protocol === "http:" ||
        parsed.protocol === "https:"
      );
    } catch {
      return false;
    }
  }

  async function handleCreate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedUrl = originalUrl.trim();

    if (!isValidHttpUrl(trimmedUrl)) {
      setNotice(
        isFa
          ? "آدرس باید معتبر و با http:// یا https:// شروع شود."
          : "Enter a valid http:// or https:// URL.",
      );
      return;
    }

    setCreating(true);

    try {
      const result = await apiRequest<LinkResponse>("/links", {
        method: "POST",
        body: JSON.stringify({ originalUrl: trimmedUrl }),
      });

      if (!result.link) {
        throw new Error(
          isFa
            ? "اطلاعات لینک دریافت نشد."
            : "Link details were not returned.",
        );
      }

      setOriginalUrl("");
      setShowCreate(false);

      const loaded = await loadLinks(false);

      if (!loaded) {
        setLinks((current) => [
          result.link!,
          ...current.filter(
            (link) => link.id !== result.link!.id,
          ),
        ]);
      }

      setNotice(
        isFa
          ? `لینک کوتاه ساخته شد: ${result.link.shortUrl}`
          : `Short link created: ${result.link.shortUrl}`,
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "ساخت لینک ناموفق بود.",
      );
    } finally {
      setCreating(false);
    }
  }

  function startEditing(link: DashboardLink) {
    setEditingLink(link);
    setEditUrl(link.originalUrl);
    setNotice("");
  }

  async function handleUpdateLink(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingLink) {
      return;
    }

    const trimmedUrl = editUrl.trim();

    if (!isValidHttpUrl(trimmedUrl)) {
      setNotice(
        isFa
          ? "آدرس باید معتبر و با http:// یا https:// شروع شود."
          : "Enter a valid http:// or https:// URL.",
      );
      return;
    }

    setSavingEdit(true);

    try {
      await apiRequest<LinkResponse>(
        `/links/${encodeURIComponent(editingLink.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            originalUrl: trimmedUrl,
          }),
        },
      );

      setEditingLink(null);
      await loadLinks(false);

      setNotice(
        isFa
          ? "آدرس مقصد با موفقیت ویرایش شد."
          : "Destination URL updated successfully.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isFa
            ? "ویرایش لینک ناموفق بود."
            : "Failed to update link.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleLink(link: DashboardLink) {
    setBusyLinkId(link.id);

    try {
      await apiRequest(
        `/links/${encodeURIComponent(link.id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            isActive: !link.isActive,
          }),
        },
      );

      await loadLinks(false);

      setNotice(
        link.isActive
          ? isFa
            ? "لینک غیرفعال شد."
            : "Link disabled."
          : isFa
            ? "لینک فعال شد."
            : "Link enabled.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isFa
            ? "تغییر وضعیت ناموفق بود."
            : "Failed to change link status.",
      );
    } finally {
      setBusyLinkId(null);
    }
  }

  async function handleDeleteLink(link: DashboardLink) {
    const confirmed = window.confirm(
      isFa
        ? `لینک /${link.code} حذف شود؟ این کار قابل بازگشت نیست.`
        : `Delete /${link.code}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyLinkId(link.id);

    try {
      await apiRequest(
        `/links/${encodeURIComponent(link.id)}`,
        {
          method: "DELETE",
        },
      );

      setLinks((current) =>
        current.filter((item) => item.id !== link.id),
      );

      setNotice(
        isFa ? "لینک حذف شد." : "Link deleted.",
      );
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : isFa
            ? "حذف لینک ناموفق بود."
            : "Failed to delete link.",
      );
    } finally {
      setBusyLinkId(null);
    }
  }

  function navigateTo(page: string) {
    navigate(page === "dashboard" ? "/" : `/${page}`);
    setMenuOpen(false);
    setSearch("");
  }

  function refreshAnalytics() {
    void loadLinks();
    setAnalyticsRefreshKey((value) => value + 1);
  }

  function renderStats() {
    const stats = [
      {
        label: t.totalLinks,
        value: links.length,
        icon: <Link2 size={20} />,
        color: "stat-icon-purple",
      },
      {
        label: t.totalClicks,
        value: totalClicks,
        icon: <MousePointerClick size={20} />,
        color: "stat-icon-blue",
      },
      {
        label: t.avgClicks,
        value: averageClicks,
        icon: <ChartColumn size={20} />,
        color: "stat-icon-green",
      },
      {
        label: t.activeLinks,
        value: activeLinks,
        icon: <Users size={20} />,
        color: "stat-icon-orange",
      },
    ];

    return (
      <section className="stats-grid" aria-label={t.overview}>
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className="stat-card-top">
              <span className="stat-label">{stat.label}</span>
              <div className={`stat-icon ${stat.color}`}>
                {stat.icon}
              </div>
            </div>

            <div className="stat-number">
              {loadingLinks
                ? "—"
                : stat.value.toLocaleString(
                    isFa ? "fa-IR" : "en-US",
                  )}
            </div>

            <div className="stat-footer">
              <span>{t.compared}</span>
            </div>
          </article>
        ))}
      </section>
    );
  }

  function renderChart() {
    const chartTotal = analytics?.totalClicks ?? 0;

    return (
      <section className="chart-card">
        <div className="section-heading">
          <div>
            <h2>{t.weekly}</h2>
            <p>{t.weeklySub}</p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {([7, 30] as AnalyticsDays[]).map((days) => (
              <button
                key={days}
                type="button"
                className="period-button"
                aria-pressed={analyticsDays === days}
                onClick={() => setAnalyticsDays(days)}
                style={{
                  background:
                    analyticsDays === days
                      ? "#6758e8"
                      : undefined,
                  color:
                    analyticsDays === days
                      ? "#ffffff"
                      : undefined,
                  borderColor:
                    analyticsDays === days
                      ? "#6758e8"
                      : undefined,
                }}
              >
                {isFa
                  ? days === 7
                    ? "۷ روز"
                    : "۳۰ روز"
                  : `${days} days`}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-summary">
          <strong>
            {chartTotal.toLocaleString(
              isFa ? "fa-IR" : "en-US",
            )}
          </strong>

          <span>
            {isFa
              ? `مجموع کلیک‌ها در ${analyticsDays} روز`
              : `Total clicks in the last ${analyticsDays} days`}
          </span>

          <span className="trend trend-up">
            <MousePointerClick size={15} />
            {analyticsDays} {isFa ? "روز" : "days"}
          </span>
        </div>

        <div className="chart-wrap">
          {loadingAnalytics ? (
            <div className="empty-state">
              {isFa
                ? "در حال دریافت آمار..."
                : "Loading analytics..."}
            </div>
          ) : chartData.length === 0 ? (
            <div className="empty-state">
              {isFa
                ? "در این بازه هنوز کلیکی ثبت نشده است."
                : "No clicks have been recorded in this period."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 12,
                  right: 8,
                  left: 0,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="clickGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#6758e8"
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="95%"
                      stopColor="#6758e8"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#edf0f5"
                  strokeDasharray="4 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8991a5", fontSize: 12 }}
                  tickMargin={12}
                  interval={analyticsDays === 30 ? 4 : 0}
                />

                <YAxis
                  orientation={isFa ? "right" : "left"}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8991a5", fontSize: 12 }}
                  width={36}
                  allowDecimals={false}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e9ebf3",
                    boxShadow: "0 8px 24px #20204012",
                  }}
                  formatter={(value) => [
                    value,
                    isFa ? "کلیک" : "Clicks",
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#6758e8"
                  strokeWidth={2.5}
                  fill="url(#clickGradient)"
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    );
  }

  function renderLinksTable() {
    return (
      <section className="links-card">
        <div className="section-heading links-heading">
          <div>
            <h2>{t.recent}</h2>
            <p>
              {isFa
                ? "لینک‌هایی که در حساب شما ذخیره شده‌اند"
                : "Links saved in your account"}
            </p>
          </div>

          {currentPage === "dashboard" && (
            <button
              className="text-button"
              onClick={() => navigateTo("links")}
            >
              {t.viewAll}
              {isFa ? (
                <ArrowDownRight size={16} />
              ) : (
                <ArrowUpRight size={16} />
              )}
            </button>
          )}

          {currentPage === "links" && (
            <button
              className="primary-button"
              onClick={() => setShowCreate(true)}
            >
              <Plus size={18} />
              {t.create}
            </button>
          )}
        </div>

        <div className="table-scroll">
          <table className="links-table">
            <thead>
              <tr>
                <th>{t.shortLink}</th>
                <th>{t.destination}</th>
                <th>{t.clicks}</th>
                <th>{t.created}</th>
                <th>{t.status}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>

            <tbody>
              {loadingLinks ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    {isFa
                      ? "در حال دریافت لینک‌ها..."
                      : "Loading links..."}
                  </td>
                </tr>
              ) : filteredLinks.length > 0 ? (
                filteredLinks.map((link, index) => (
                  <tr key={link.id}>
                    <td>
                      <div className="short-link-cell">
                        <div
                          className={`link-mini-icon ${
                            ["purple", "blue", "orange"][index % 3]
                          }`}
                        >
                          <Link2 size={16} />
                        </div>

                        <div>
                          <strong>/{link.code}</strong>
                          <span>{link.shortUrl}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <a
                        className="destination-link"
                        href={link.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => {
                          if (!link.isActive) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <span>
                          {getDestination(link.originalUrl)}
                        </span>
                        <ExternalLink size={13} />
                      </a>
                    </td>

                    <td>
                      <strong className="click-count">
                        {link.clicks.toLocaleString(
                          isFa ? "fa-IR" : "en-US",
                        )}
                      </strong>
                    </td>

                    <td className="date-cell">
                      {formatDate(link.createdAt, isFa)}
                    </td>

                    <td>
                      <span
                        className={`link-status ${
                          link.isActive
                            ? "link-status-active"
                            : "link-status-inactive"
                        }`}
                      >
                        <span />
                        {link.isActive
                          ? isFa
                            ? "فعال"
                            : "Active"
                          : isFa
                            ? "غیرفعال"
                            : "Disabled"}
                      </span>
                    </td>

                    <td>
                      <div className="link-actions">
                        <button
                          className="table-action"
                          title={isFa ? "کپی لینک" : "Copy link"}
                          aria-label={
                            isFa ? "کپی لینک" : "Copy link"
                          }
                          onClick={() =>
                            void copyLink(link.shortUrl)
                          }
                        >
                          <Copy size={15} />
                        </button>

                        <button
                          className="table-action"
                          title={
                            isFa ? "ویرایش آدرس" : "Edit destination"
                          }
                          aria-label={
                            isFa ? "ویرایش آدرس" : "Edit destination"
                          }
                          onClick={() => startEditing(link)}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          className="table-action"
                          disabled={busyLinkId === link.id}
                          title={
                            link.isActive
                              ? isFa
                                ? "غیرفعال کردن"
                                : "Disable"
                              : isFa
                                ? "فعال کردن"
                                : "Enable"
                          }
                          aria-label={
                            link.isActive
                              ? isFa
                                ? "غیرفعال کردن"
                                : "Disable"
                              : isFa
                                ? "فعال کردن"
                                : "Enable"
                          }
                          onClick={() =>
                            void handleToggleLink(link)
                          }
                        >
                          <Power size={15} />
                        </button>

                        <button
                          className="table-action danger-action"
                          disabled={busyLinkId === link.id}
                          title={isFa ? "حذف لینک" : "Delete link"}
                          aria-label={
                            isFa ? "حذف لینک" : "Delete link"
                          }
                          onClick={() =>
                            void handleDeleteLink(link)
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="empty-state">
                    {search
                      ? isFa
                        ? "لینکی با این عبارت پیدا نشد."
                        : "No matching links found."
                      : isFa
                        ? "هنوز لینکی نساخته‌ای. از دکمه ساخت لینک جدید استفاده کن."
                        : "No links yet. Create your first short link."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            {isFa
              ? `${filteredLinks.length.toLocaleString(
                  "fa-IR",
                )} لینک از ${links.length.toLocaleString("fa-IR")} لینک`
              : `${filteredLinks.length} of ${links.length} links`}
          </span>

          <span className="table-footer-status">
            <span />
            {isFa
              ? "اطلاعات از سرور دریافت می‌شود"
              : "Connected to API"}
          </span>
        </div>
      </section>
    );
  }

  function renderDashboard() {
    return (
      <>
        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              {isFa ? "داشبورد لینک‌شورت" : "LINKSHORT DASHBOARD"}
            </div>
            <h1>{t.welcome}</h1>
            <p className="welcome-subtitle">{t.subtitle}</p>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={19} />
            <span>{t.create}</span>
          </button>
        </section>

        {renderStats()}
        {renderChart()}
        {renderLinksTable()}
      </>
    );
  }

  function renderAnalytics() {
    return (
      <>
        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              {isFa ? "گزارش عملکرد" : "PERFORMANCE REPORT"}
            </div>
            <h1>{t.analytics}</h1>
            <p className="welcome-subtitle">
              {isFa
                ? "آمار کلیک‌ها و عملکرد لینک‌های ذخیره‌شده را بررسی کن."
                : "Review clicks and performance for your saved links."}
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={refreshAnalytics}
          >
            <Activity size={17} />
            {isFa ? "به‌روزرسانی آمار" : "Refresh analytics"}
          </button>
        </section>

        {renderStats()}
        {renderChart()}

        <section className="links-card">
          <div className="section-heading">
            <div>
              <h2>{isFa ? "پربازدیدترین لینک‌ها" : "Top links"}</h2>
              <p>
                {isFa
                  ? "لینک‌ها بر اساس تعداد کلیک مرتب شده‌اند."
                  : "Links ordered by recorded clicks."}
              </p>
            </div>
          </div>

          <div className="table-scroll">
            <table className="links-table">
              <thead>
                <tr>
                  <th>{t.shortLink}</th>
                  <th>{t.destination}</th>
                  <th>{t.clicks}</th>
                  <th>{t.created}</th>
                  <th>{t.status}</th>
                </tr>
              </thead>

              <tbody>
                {[...links]
                  .sort((a, b) => b.clicks - a.clicks)
                  .map((link) => (
                    <tr key={link.id}>
                      <td>
                        <div className="short-link-cell">
                          <div className="link-mini-icon purple">
                            <Link2 size={16} />
                          </div>

                          <div>
                            <strong>/{link.code}</strong>
                            <span>{link.shortUrl}</span>
                          </div>
                        </div>
                      </td>

                      <td>{getDestination(link.originalUrl)}</td>

                      <td>
                        <strong className="click-count">
                          {link.clicks.toLocaleString(
                            isFa ? "fa-IR" : "en-US",
                          )}
                        </strong>
                      </td>

                      <td className="date-cell">
                        {formatDate(link.createdAt, isFa)}
                      </td>

                      <td>
                        <span
                          className={`link-status ${
                            link.isActive
                              ? "link-status-active"
                              : "link-status-inactive"
                          }`}
                        >
                          <span />
                          {link.isActive
                            ? isFa
                              ? "فعال"
                              : "Active"
                            : isFa
                              ? "غیرفعال"
                              : "Disabled"}
                        </span>
                      </td>
                    </tr>
                  ))}

                {!loadingLinks && links.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      {isFa
                        ? "هنوز لینکی برای نمایش وجود ندارد."
                        : "There are no links to display yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }

  function renderSettings() {
    return (
      <>
        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              {isFa ? "مدیریت حساب" : "ACCOUNT MANAGEMENT"}
            </div>
            <h1>{t.settings}</h1>
            <p className="welcome-subtitle">
              {isFa
                ? "تنظیمات ظاهری و ترجیحات برنامه را مدیریت کن."
                : "Manage your application preferences."}
            </p>
          </div>
        </section>

        <section className="links-card">
          <div className="section-heading">
            <div>
              <h2>{isFa ? "تنظیمات عمومی" : "General settings"}</h2>
              <p>
                {isFa
                  ? "این تنظیمات در حال حاضر برای همین نشست برنامه اعمال می‌شوند."
                  : "These preferences currently apply to this app session."}
              </p>
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong>
                  {isFa ? "زبان برنامه" : "Application language"}
                </strong>
                <p style={{ marginTop: "8px", color: "#8991a5" }}>
                  {isFa
                    ? "زبان رابط کاربری را انتخاب کن."
                    : "Choose the interface language."}
                </p>
              </div>

              <button
                className="language-button"
                onClick={() => setLanguage(isFa ? "en" : "fa")}
              >
                <Globe size={17} />
                <span>{isFa ? "فارسی" : "English"}</span>
                <ChevronDown size={15} />
              </button>
            </div>

            <hr
              style={{
                border: 0,
                borderTop: "1px solid #edf0f5",
                margin: "24px 0",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong>
                  {isFa ? "وضعیت اتصال سرور" : "Server connection"}
                </strong>
                <p style={{ marginTop: "8px", color: "#8991a5" }}>
                  {isFa
                    ? "اطلاعات لینک‌ها از API دریافت می‌شود."
                    : "Link information is retrieved from the API."}
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={() => void loadLinks()}
              >
                <Activity size={17} />
                {isFa ? "بررسی مجدد" : "Check again"}
              </button>
            </div>

            <hr
              style={{
                border: 0,
                borderTop: "1px solid #edf0f5",
                margin: "24px 0",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <strong>
                  {isFa ? "خروج از حساب" : "Sign out"}
                </strong>
                <p style={{ marginTop: "8px", color: "#8991a5" }}>
                  {isFa
                    ? "نشست فعلی را خاتمه بده."
                    : "End your current session."}
                </p>
              </div>

              <button className="secondary-button" onClick={onLogout}>
                <LogOut size={17} />
                {t.logout}
              </button>
            </div>
          </div>
        </section>
      </>
    );
  }

  function renderHelp() {
    return (
      <>
        <section className="welcome-row">
          <div>
            <div className="eyebrow">
              {isFa ? "مرکز راهنما" : "HELP CENTER"}
            </div>
            <h1>{t.help}</h1>
            <p className="welcome-subtitle">
              {isFa
                ? "پاسخ پرسش‌های رایج درباره استفاده از LinkShort."
                : "Answers to common questions about using LinkShort."}
            </p>
          </div>
        </section>

        <section className="links-card">
          <div className="section-heading">
            <div>
              <h2>
                {isFa
                  ? "پرسش‌های متداول"
                  : "Frequently asked questions"}
              </h2>
              <p>
                {isFa
                  ? "راهنمای سریع استفاده از برنامه"
                  : "A quick guide to using the application"}
              </p>
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <strong>
                {isFa
                  ? "چطور لینک کوتاه بسازم؟"
                  : "How do I create a short link?"}
              </strong>
              <p style={{ marginTop: "8px", lineHeight: 1.9 }}>
                {isFa
                  ? "از دکمه «ساخت لینک جدید» استفاده کن، آدرس اصلی را وارد کن و ساخت لینک را بزن."
                  : "Select Create new link, enter the destination URL, and submit the form."}
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <strong>
                {isFa
                  ? "چطور لینک را کپی کنم؟"
                  : "How do I copy a short link?"}
              </strong>
              <p style={{ marginTop: "8px", lineHeight: 1.9 }}>
                {isFa
                  ? "در جدول لینک‌ها روی آیکون کپی کنار لینک موردنظر کلیک کن."
                  : "Click the copy icon next to the link in the links table."}
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <strong>
                {isFa
                  ? "چطور لینک را مدیریت کنم؟"
                  : "How do I manage a link?"}
              </strong>
              <p style={{ marginTop: "8px", lineHeight: 1.9 }}>
                {isFa
                  ? "از جدول لینک‌ها می‌توانی آدرس مقصد را ویرایش، لینک را فعال یا غیرفعال و در صورت نیاز حذف کنی."
                  : "Use the links table to edit the destination, enable or disable a link, or delete it."}
              </p>
            </div>

            <div>
              <strong>
                {isFa
                  ? "اگر سرور در دسترس نبود چه کار کنم؟"
                  : "What if the server is unavailable?"}
              </strong>
              <p style={{ marginTop: "8px", lineHeight: 1.9 }}>
                {isFa
                  ? "مطمئن شو بک‌اند و دیتابیس در حال اجرا هستند؛ سپس صفحه را دوباره بارگذاری کن."
                  : "Make sure the backend and database are running, then reload the page."}
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  const pageTitles: Record<string, string> = {
    dashboard: t.dashboard,
    links: t.links,
    analytics: t.analytics,
    settings: t.settings,
    help: t.help,
  };

  return (
    <div className="app-shell" dir={direction}>
      {menuOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Link2 size={25} strokeWidth={2.5} />
          </div>

          <div className="brand-copy">
            <strong>LinkShort</strong>
            <span>{t.workspace}</span>
          </div>

          <button
            className="icon-button sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-section-label">{t.overview}</div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${
              currentPage === "dashboard" ? "nav-item-active" : ""
            }`}
            onClick={() => navigateTo("dashboard")}
          >
            <LayoutDashboard size={19} />
            <span>{t.dashboard}</span>
          </button>

          <button
            className={`nav-item ${
              currentPage === "links" ? "nav-item-active" : ""
            }`}
            onClick={() => navigateTo("links")}
          >
            <Link2 size={19} />
            <span>{t.links}</span>
          </button>

          <button
            className={`nav-item ${
              currentPage === "analytics" ? "nav-item-active" : ""
            }`}
            onClick={() => navigateTo("analytics")}
          >
            <ChartColumn size={19} />
            <span>{t.analytics}</span>
          </button>
        </nav>

        <div className="sidebar-section-label sidebar-label-lower">
          {isFa ? "حساب کاربری" : "ACCOUNT"}
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${
              currentPage === "settings" ? "nav-item-active" : ""
            }`}
            onClick={() => navigateTo("settings")}
          >
            <Settings size={19} />
            <span>{t.settings}</span>
          </button>

          <button
            className={`nav-item ${
              currentPage === "help" ? "nav-item-active" : ""
            }`}
            onClick={() => navigateTo("help")}
          >
            <CircleHelp size={19} />
            <span>{t.help}</span>
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="security-card">
            <div className="security-icon">
              <ShieldCheck size={21} />
            </div>

            <strong>
              {isFa ? "حساب امن شما" : "Your account is secure"}
            </strong>

            <p>
              {isFa
                ? "لینک‌ها فقط برای حساب شما قابل مدیریت هستند."
                : "Only you can manage your private links."}
            </p>
          </div>

          <button className="nav-item logout-item" onClick={onLogout}>
            <LogOut size={19} />
            <span>{t.logout}</span>
          </button>

          <div className="sidebar-version">LINKSHORT · LOCAL APP</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-start">
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div className="breadcrumb">
              <span>{isFa ? "فضای کاری" : "Workspace"}</span>
              <span className="breadcrumb-separator">/</span>
              <strong>
                {pageTitles[currentPage] ?? t.dashboard}
              </strong>
            </div>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.search}
                aria-label={t.search}
              />

              <kbd>⌘ K</kbd>
            </label>

            <button
              className="language-button"
              onClick={() => setLanguage(isFa ? "en" : "fa")}
              aria-label="Change language"
            >
              <Globe size={17} />
              <span>{isFa ? "فارسی" : "English"}</span>
              <ChevronDown size={15} />
            </button>

            <button
              className="icon-button notification-button"
              onClick={() =>
                setNotice(
                  isFa
                    ? "فعلاً اعلان جدیدی ندارید."
                    : "You have no new notifications.",
                )
              }
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <div className="avatar">LS</div>
          </div>
        </header>

        <div className="page-content">
          <div className="preview-notice">
            <Activity size={16} />

            <span>
              {isFa
                ? "اتصال به سرور برقرار است؛ اطلاعات لینک‌ها از دیتابیس خوانده می‌شود."
                : "Connected to the server. Link data is loaded from the database."}
            </span>
          </div>

          {currentPage === "dashboard" && renderDashboard()}

          {currentPage === "links" && (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    {isFa ? "مدیریت لینک‌ها" : "LINK MANAGEMENT"}
                  </div>

                  <h1>{t.links}</h1>

                  <p className="welcome-subtitle">
                    {isFa
                      ? "همه لینک‌های کوتاه ذخیره‌شده در حساب خود را مدیریت کن."
                      : "Manage all short links saved in your account."}
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus size={19} />
                  <span>{t.create}</span>
                </button>
              </section>

              {renderLinksTable()}
            </>
          )}

          {currentPage === "analytics" && renderAnalytics()}
          {currentPage === "settings" && renderSettings()}
          {currentPage === "help" && renderHelp()}

          <footer className="page-footer">
            <span>© 2026 LinkShort</span>
            <span>
              {isFa
                ? "ساخته‌شده برای مدیریت ساده‌تر لینک‌ها"
                : "A simpler way to manage your links"}
            </span>
          </footer>
        </div>
      </main>

      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>

          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showCreate && (
        <div
          className="modal-backdrop"
          onClick={() => setShowCreate(false)}
        >
          <section
            className="create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div className="modal-icon">
                <Link2 size={22} />
              </div>

              <button
                className="icon-button"
                onClick={() => setShowCreate(false)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <h2 id="create-modal-title">{t.createTitle}</h2>

            <p className="modal-description">
              {isFa
                ? "آدرس اصلی را وارد کن تا لینک کوتاه ساخته و در حساب ذخیره شود."
                : "Enter the destination URL to create and save a short link."}
            </p>

            <form onSubmit={handleCreate}>
              <label htmlFor="original-url">{t.original}</label>

              <input
                id="original-url"
                type="url"
                required
                value={originalUrl}
                onChange={(event) =>
                  setOriginalUrl(event.target.value)
                }
                placeholder={t.originalPlaceholder}
                autoFocus
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating}
                >
                  <Plus size={17} />

                  {creating
                    ? isFa
                      ? "در حال ساخت..."
                      : "Creating..."
                    : t.createButton}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {editingLink && (
        <div
          className="modal-backdrop"
          onClick={() => {
            if (!savingEdit) {
              setEditingLink(null);
            }
          }}
        >
          <section
            className="create-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div className="modal-icon">
                <Pencil size={22} />
              </div>

              <button
                className="icon-button"
                onClick={() => setEditingLink(null)}
                aria-label="Close"
                disabled={savingEdit}
              >
                <X size={19} />
              </button>
            </div>

            <h2 id="edit-modal-title">
              {isFa ? "ویرایش آدرس مقصد" : "Edit destination URL"}
            </h2>

            <p className="modal-description">
              {isFa
                ? `آدرس مقصد لینک /${editingLink.code} را تغییر بده.`
                : `Change the destination for /${editingLink.code}.`}
            </p>

            <form onSubmit={handleUpdateLink}>
              <label htmlFor="edit-original-url">{t.original}</label>

              <input
                id="edit-original-url"
                type="url"
                required
                value={editUrl}
                onChange={(event) => setEditUrl(event.target.value)}
                placeholder={t.originalPlaceholder}
                autoFocus
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingLink(null)}
                  disabled={savingEdit}
                >
                  {t.cancel}
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingEdit}
                >
                  <Pencil size={17} />

                  {savingEdit
                    ? isFa
                      ? "در حال ذخیره..."
                      : "Saving..."
                    : isFa
                      ? "ذخیره تغییرات"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;