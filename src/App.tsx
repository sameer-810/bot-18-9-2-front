import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./app/layouts/AppLayout";
import { RequireAuth } from "./app/router/RequireAuth";
import { RequireRole } from "./app/router/RequireRole";
import { NotFoundPage } from "./app/router/NotFoundPage";
import { PageLoader } from "./shared/components/PageLoader";

const LoginPage = lazy(() =>
  import("./modules/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("./modules/dashboard/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const TenantListPage = lazy(() =>
  import("./modules/tenants/pages/TenantListPage").then((m) => ({ default: m.TenantListPage })),
);
const TenantDetailPage = lazy(() =>
  import("./modules/tenants/pages/TenantDetailPage").then((m) => ({
    default: m.TenantDetailPage,
  })),
);
const MyBusinessPage = lazy(() =>
  import("./modules/tenants/pages/MyBusinessPage").then((m) => ({ default: m.MyBusinessPage })),
);
const UsersPage = lazy(() =>
  import("./modules/users/pages/UsersPage").then((m) => ({ default: m.UsersPage })),
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="tenants"
            element={
              <RequireRole roles={["admin"]}>
                <TenantListPage />
              </RequireRole>
            }
          />
          {/* Every role: owner/staff reach their own tenant here, the API scopes the rest. */}
          <Route path="tenants/:id" element={<TenantDetailPage />} />
          <Route path="my-business" element={<MyBusinessPage />} />
          <Route
            path="users"
            element={
              <RequireRole roles={["admin", "owner"]}>
                <UsersPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path="*"
          element={
            <RequireAuth>
              <Navigate to="/dashboard" replace />
            </RequireAuth>
          }
        />
      </Routes>
    </Suspense>
  );
}
