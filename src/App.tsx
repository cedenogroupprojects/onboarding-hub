import { Route, Routes } from "react-router-dom"
import { RequireAuth } from "@/components/auth/RequireAuth"
import { RequireRole } from "@/components/auth/RequireRole"
import { RoleRedirect } from "@/components/auth/RoleRedirect"
import { AppShell } from "@/components/layout/AppShell"
import { SignInPage } from "@/pages/SignInPage"
import { NoRoleAssignedPage } from "@/pages/NoRoleAssignedPage"
import { LeadershipDashboardPage } from "@/features/recruits/LeadershipDashboardPage"
import { VaDashboardPage } from "@/features/recruits/VaDashboardPage"
import { RecruitDetailPage } from "@/features/recruits/RecruitDetailPage"
import { OnboardingProgramsPage } from "@/features/programs/OnboardingProgramsPage"

function App() {
  return (
    <Routes>
      <Route path="/sign-in/*" element={<SignInPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/no-role" element={<NoRoleAssignedPage />} />

        <Route element={<AppShell />}>
          <Route path="/" element={<RoleRedirect />} />

          <Route
            path="/leadership"
            element={
              <RequireRole role="leadership">
                <LeadershipDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/leadership/programs"
            element={
              <RequireRole role="leadership">
                <OnboardingProgramsPage />
              </RequireRole>
            }
          />
          <Route
            path="/recruits/:recruitId"
            element={
              <RequireRole role="leadership">
                <RecruitDetailPage />
              </RequireRole>
            }
          />

          <Route
            path="/va"
            element={
              <RequireRole role="va">
                <VaDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/va/recruits/:recruitId"
            element={
              <RequireRole role="va">
                <RecruitDetailPage />
              </RequireRole>
            }
          />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
