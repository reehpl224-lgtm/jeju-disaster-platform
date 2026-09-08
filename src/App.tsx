import { Navigate, Route, Routes } from "react-router-dom"
import { LoginPage } from "./pages/LoginPage"
import { ForbiddenPage } from "./pages/ForbiddenPage"
import { DashboardPage } from "./pages/DashboardPage"
import { MonitoringPage } from "./pages/MonitoringPage"
import { RequireAuth } from "./routes/RequireAuth"
import { ReportsListPage } from "./pages/reports/ReportsListPage"
import { ReportDetailPage } from "./pages/reports/ReportDetailPage"
import { AquaHomePage } from "./pages/aqua/AquaHomePage"
import { AquaDataPage } from "./pages/aqua/AquaDataPage"
import { AquaPredictionPage } from "./pages/aqua/AquaPredictionPage"
import { AquaFarmsPage } from "./pages/aqua/AquaFarmsPage"
import { AquaFarmDetailPage } from "./pages/aqua/AquaFarmDetailPage"
import { AquaAlertPage } from "./pages/aqua/AquaAlertPage"
import { AquaResponsePage } from "./pages/aqua/AquaResponsePage"
import { AquaMonitoringPage } from "./pages/aqua/AquaMonitoringPage"
import { AquaClosurePage } from "./pages/aqua/AquaClosurePage"
import { CoastHomePage } from "./pages/coast/CoastHomePage"
import { CoastEventDetailPage } from "./pages/coast/CoastEventDetailPage"
import { CoastAlertPage } from "./pages/coast/CoastAlertPage"
import { CoastDispatchPage } from "./pages/coast/CoastDispatchPage"
import { CoastMonitoringPage } from "./pages/coast/CoastMonitoringPage"
import { CoastClosurePage } from "./pages/coast/CoastClosurePage"
import { RiverHomePage } from "./pages/river/RiverHomePage"
import { RiverAnalysisPage } from "./pages/river/RiverAnalysisPage"
import { RiverAlertPage } from "./pages/river/RiverAlertPage"
import { RiverControlPage } from "./pages/river/RiverControlPage"
import { RiverDispatchPage } from "./pages/river/RiverDispatchPage"
import { RiverClosurePage } from "./pages/river/RiverClosurePage"
import { WindFloodHomePage } from "./pages/windflood/WindFloodHomePage"
import { HeatHomePage } from "./pages/heat/HeatHomePage"
import { PropagationHomePage } from "./pages/propagation/PropagationHomePage"

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

        <Route path="/coast" element={<CoastHomePage />} />
        <Route path="/coast/events" element={<CoastEventDetailPage />} />
        <Route path="/coast/alerts" element={<CoastAlertPage />} />
        <Route path="/coast/dispatch" element={<CoastDispatchPage />} />
        <Route path="/coast/monitoring" element={<CoastMonitoringPage />} />
        <Route path="/coast/closure" element={<CoastClosurePage />} />

        <Route path="/river" element={<RiverHomePage />} />
        <Route path="/river/analysis" element={<RiverAnalysisPage />} />
        <Route path="/river/alert" element={<RiverAlertPage />} />
        <Route path="/river/control" element={<RiverControlPage />} />
        <Route path="/river/dispatch" element={<RiverDispatchPage />} />
        <Route path="/river/closure" element={<RiverClosurePage />} />

        <Route path="/wind-flood" element={<WindFloodHomePage />} />
        <Route path="/heat" element={<HeatHomePage />} />
        <Route path="/propagation" element={<PropagationHomePage />} />

        <Route path="/reports" element={<ReportsListPage />} />
        <Route path="/reports/:incidentId" element={<ReportDetailPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
