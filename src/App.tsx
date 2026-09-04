import { Navigate, Route, Routes } from "react-router-dom"
import { LoginPage } from "./pages/LoginPage"
import { ForbiddenPage } from "./pages/ForbiddenPage"
import { DashboardPage } from "./pages/DashboardPage"
import { MonitoringPage } from "./pages/MonitoringPage"
import { PlaceholderServicePage } from "./pages/PlaceholderServicePage"
import { RequireAuth } from "./routes/RequireAuth"
import { AquaHomePage } from "./pages/aqua/AquaHomePage"
import { AquaDataPage } from "./pages/aqua/AquaDataPage"
import { AquaPredictionPage } from "./pages/aqua/AquaPredictionPage"
import { AquaFarmsPage } from "./pages/aqua/AquaFarmsPage"
import { AquaFarmDetailPage } from "./pages/aqua/AquaFarmDetailPage"
import { AquaAlertPage } from "./pages/aqua/AquaAlertPage"
import { AquaResponsePage } from "./pages/aqua/AquaResponsePage"
import { AquaMonitoringPage } from "./pages/aqua/AquaMonitoringPage"
import { AquaClosurePage } from "./pages/aqua/AquaClosurePage"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />

        <Route path="/aqua" element={<AquaHomePage />} />
        <Route path="/aqua/data" element={<AquaDataPage />} />
        <Route path="/aqua/prediction" element={<AquaPredictionPage />} />
        <Route path="/aqua/farms" element={<AquaFarmsPage />} />
        <Route path="/aqua/farms/:farmId" element={<AquaFarmDetailPage />} />
        <Route path="/aqua/alerts" element={<AquaAlertPage />} />
        <Route path="/aqua/response" element={<AquaResponsePage />} />
        <Route path="/aqua/monitoring" element={<AquaMonitoringPage />} />
        <Route path="/aqua/closure" element={<AquaClosurePage />} />

        <Route
          path="/coast"
          element={
            <PlaceholderServicePage
              title="연안 안전 — 위험행동 관제"
              description="AI CCTV·AIoT 스마트폴 기반 연안 위험행동 탐지, 현장 경보 및 해경 공조"
              flowSource="연안_안전관리시스템_유저플로우.html"
              screenCount={17}
              domainColor="#0d9488"
            />
          }
        />
        <Route
          path="/river"
          element={
            <PlaceholderServicePage
              title="하천 범람 — 예측 및 경보"
              description="강우레이더·수위센서 기반 하천 범람 예측, 현장 통제 및 대피 공조"
              flowSource="하천_범람예측_경보_시스템_유저플로우.html"
              screenCount={13}
              domainColor="#0284c7"
            />
          }
        />
        <Route
          path="/reports"
          element={
            <PlaceholderServicePage
              title="이력·보고서"
              description="상황 종료 보고서 및 전체 대응 이력 조회"
              flowSource="플랫폼_사용자_유저플로우.html"
              screenCount={2}
              domainColor="#0f172a"
            />
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
