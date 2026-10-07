import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { RequireAuth } from "./routes/RequireAuth"
import { CctvPlayerHost } from "./components/ui/CctvPlayerHost"

const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })))
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage").then((m) => ({ default: m.ForbiddenPage })))
const StyleguidePage = lazy(() => import("./pages/StyleguidePage").then((m) => ({ default: m.StyleguidePage })))
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })))
const MonitoringPage = lazy(() => import("./pages/MonitoringPage").then((m) => ({ default: m.MonitoringPage })))
const ReportsListPage = lazy(() => import("./pages/reports/ReportsListPage").then((m) => ({ default: m.ReportsListPage })))
const ReportDetailPage = lazy(() => import("./pages/reports/ReportDetailPage").then((m) => ({ default: m.ReportDetailPage })))
const AquaHomePage = lazy(() => import("./pages/aqua/AquaHomePage").then((m) => ({ default: m.AquaHomePage })))
const AquaDataPage = lazy(() => import("./pages/aqua/AquaDataPage").then((m) => ({ default: m.AquaDataPage })))
const AquaPredictionPage = lazy(() => import("./pages/aqua/AquaPredictionPage").then((m) => ({ default: m.AquaPredictionPage })))
const AquaFarmsPage = lazy(() => import("./pages/aqua/AquaFarmsPage").then((m) => ({ default: m.AquaFarmsPage })))
const AquaFarmDetailPage = lazy(() => import("./pages/aqua/AquaFarmDetailPage").then((m) => ({ default: m.AquaFarmDetailPage })))
const AquaAlertPage = lazy(() => import("./pages/aqua/AquaAlertPage").then((m) => ({ default: m.AquaAlertPage })))
const AquaResponsePage = lazy(() => import("./pages/aqua/AquaResponsePage").then((m) => ({ default: m.AquaResponsePage })))
const AquaMonitoringPage = lazy(() => import("./pages/aqua/AquaMonitoringPage").then((m) => ({ default: m.AquaMonitoringPage })))
const AquaClosurePage = lazy(() => import("./pages/aqua/AquaClosurePage").then((m) => ({ default: m.AquaClosurePage })))
const CoastHomePage = lazy(() => import("./pages/coast/CoastHomePage").then((m) => ({ default: m.CoastHomePage })))
const CoastDataPage = lazy(() => import("./pages/coast/CoastDataPage").then((m) => ({ default: m.CoastDataPage })))
const CoastEventDetailPage = lazy(() => import("./pages/coast/CoastEventDetailPage").then((m) => ({ default: m.CoastEventDetailPage })))
const CoastAlertPage = lazy(() => import("./pages/coast/CoastAlertPage").then((m) => ({ default: m.CoastAlertPage })))
const CoastDispatchPage = lazy(() => import("./pages/coast/CoastDispatchPage").then((m) => ({ default: m.CoastDispatchPage })))
const CoastMonitoringPage = lazy(() => import("./pages/coast/CoastMonitoringPage").then((m) => ({ default: m.CoastMonitoringPage })))
const CoastClosurePage = lazy(() => import("./pages/coast/CoastClosurePage").then((m) => ({ default: m.CoastClosurePage })))
const RiverHomePage = lazy(() => import("./pages/river/RiverHomePage").then((m) => ({ default: m.RiverHomePage })))
const RiverDataPage = lazy(() => import("./pages/river/RiverDataPage").then((m) => ({ default: m.RiverDataPage })))
const RiverAnalysisPage = lazy(() => import("./pages/river/RiverAnalysisPage").then((m) => ({ default: m.RiverAnalysisPage })))
const RiverAlertPage = lazy(() => import("./pages/river/RiverAlertPage").then((m) => ({ default: m.RiverAlertPage })))
const RiverMonitoringPage = lazy(() => import("./pages/river/RiverMonitoringPage").then((m) => ({ default: m.RiverMonitoringPage })))
const RiverControlPage = lazy(() => import("./pages/river/RiverControlPage").then((m) => ({ default: m.RiverControlPage })))
const RiverDispatchPage = lazy(() => import("./pages/river/RiverDispatchPage").then((m) => ({ default: m.RiverDispatchPage })))
const RiverClosurePage = lazy(() => import("./pages/river/RiverClosurePage").then((m) => ({ default: m.RiverClosurePage })))
const HeavyRainHomePage = lazy(() => import("./pages/heavyrain/HeavyRainHomePage").then((m) => ({ default: m.HeavyRainHomePage })))
const HeavyRainDataPage = lazy(() => import("./pages/heavyrain/HeavyRainDataPage").then((m) => ({ default: m.HeavyRainDataPage })))
const HeavyRainAnalysisPage = lazy(() => import("./pages/heavyrain/HeavyRainAnalysisPage").then((m) => ({ default: m.HeavyRainAnalysisPage })))
const HeavyRainAlertPage = lazy(() => import("./pages/heavyrain/HeavyRainAlertPage").then((m) => ({ default: m.HeavyRainAlertPage })))
const HeavyRainClosurePage = lazy(() => import("./pages/heavyrain/HeavyRainClosurePage").then((m) => ({ default: m.HeavyRainClosurePage })))
const TyphoonHomePage = lazy(() => import("./pages/typhoon/TyphoonHomePage").then((m) => ({ default: m.TyphoonHomePage })))
const TyphoonDataPage = lazy(() => import("./pages/typhoon/TyphoonDataPage").then((m) => ({ default: m.TyphoonDataPage })))
const TyphoonAnalysisPage = lazy(() => import("./pages/typhoon/TyphoonAnalysisPage").then((m) => ({ default: m.TyphoonAnalysisPage })))
const TyphoonAlertPage = lazy(() => import("./pages/typhoon/TyphoonAlertPage").then((m) => ({ default: m.TyphoonAlertPage })))
const TyphoonClosurePage = lazy(() => import("./pages/typhoon/TyphoonClosurePage").then((m) => ({ default: m.TyphoonClosurePage })))
const HeatHomePage = lazy(() => import("./pages/heat/HeatHomePage").then((m) => ({ default: m.HeatHomePage })))
const HeatDataPage = lazy(() => import("./pages/heat/HeatDataPage").then((m) => ({ default: m.HeatDataPage })))
const HeatAnalysisPage = lazy(() => import("./pages/heat/HeatAnalysisPage").then((m) => ({ default: m.HeatAnalysisPage })))
const HeatAlertPage = lazy(() => import("./pages/heat/HeatAlertPage").then((m) => ({ default: m.HeatAlertPage })))
const HeatClosurePage = lazy(() => import("./pages/heat/HeatClosurePage").then((m) => ({ default: m.HeatClosurePage })))
const HazardHomePage = lazy(() => import("./pages/hazard/HazardPages").then((m) => ({ default: m.HazardHomePage })))
const HazardDataPage = lazy(() => import("./pages/hazard/HazardPages").then((m) => ({ default: m.HazardDataPage })))
const HazardAnalysisPage = lazy(() => import("./pages/hazard/HazardPages").then((m) => ({ default: m.HazardAnalysisPage })))
const HazardAlertPage = lazy(() => import("./pages/hazard/HazardPages").then((m) => ({ default: m.HazardAlertPage })))
const HazardClosurePage = lazy(() => import("./pages/hazard/HazardPages").then((m) => ({ default: m.HazardClosurePage })))
const HAZARD_IDS = ["wildfire", "tsunami", "snow"] as const
const ApprovalsPage = lazy(() => import("./pages/approvals/ApprovalsPage").then((m) => ({ default: m.ApprovalsPage })))
const PropagationHomePage = lazy(() => import("./pages/propagation/PropagationHomePage").then((m) => ({ default: m.PropagationHomePage })))
const PilotStatusPage = lazy(() => import("./pages/pilot/PilotStatusPage").then((m) => ({ default: m.PilotStatusPage })))
const EsopPage = lazy(() => import("./pages/esop/EsopPage").then((m) => ({ default: m.EsopPage })))
const DataSystemPage = lazy(() => import("./pages/datasystem/DataSystemPage").then((m) => ({ default: m.DataSystemPage })))
const DummyDataPage = lazy(() => import("./pages/dummydata/DummyDataPage").then((m) => ({ default: m.DummyDataPage })))
const DemoVersionPage = lazy(() => import("./pages/DemoVersionPage").then((m) => ({ default: m.DemoVersionPage })))
const VlmPage = lazy(() => import("./pages/VlmPage").then((m) => ({ default: m.VlmPage })))
const AxHubPage = lazy(() => import("./pages/AxHubPage").then((m) => ({ default: m.AxHubPage })))

const DomainBoardPage = lazy(() => import("./pages/domain/DomainBoardPage").then((m) => ({ default: m.DomainBoardPage })))

function RouteFallback() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-xs text-white/30">불러오는 중...</div>
  )
}

export default function App() {
  return (
    <>
    <CctvPlayerHost />
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/styleguide" element={<StyleguidePage />} />

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/monitoring" element={<MonitoringPage />} />

          <Route path="/aqua" element={<DomainBoardPage domain="aqua" />} />
          <Route path="/aqua/dashboard" element={<AquaHomePage />} />
          <Route path="/aqua/data" element={<AquaDataPage />} />
          <Route path="/aqua/prediction" element={<AquaPredictionPage />} />
          <Route path="/aqua/farms" element={<AquaFarmsPage />} />
          <Route path="/aqua/farms/:farmId" element={<AquaFarmDetailPage />} />
          <Route path="/aqua/alerts" element={<AquaAlertPage />} />
          <Route path="/aqua/response" element={<AquaResponsePage />} />
          <Route path="/aqua/monitoring" element={<AquaMonitoringPage />} />
          <Route path="/aqua/closure" element={<AquaClosurePage />} />

          <Route path="/coast" element={<DomainBoardPage domain="coast" />} />
          <Route path="/coast/dashboard" element={<CoastHomePage />} />
          <Route path="/coast/data" element={<CoastDataPage />} />
          <Route path="/coast/events" element={<CoastEventDetailPage />} />
          <Route path="/coast/alerts" element={<CoastAlertPage />} />
          <Route path="/coast/dispatch" element={<CoastDispatchPage />} />
          <Route path="/coast/monitoring" element={<CoastMonitoringPage />} />
          <Route path="/coast/closure" element={<CoastClosurePage />} />

          <Route path="/river" element={<DomainBoardPage domain="river" />} />
          <Route path="/river/dashboard" element={<RiverHomePage />} />
          <Route path="/river/data" element={<RiverDataPage />} />
          <Route path="/river/analysis" element={<RiverAnalysisPage />} />
          <Route path="/river/alert" element={<RiverAlertPage />} />
          <Route path="/river/control" element={<RiverControlPage />} />
          <Route path="/river/monitoring" element={<RiverMonitoringPage />} />
          <Route path="/river/dispatch" element={<RiverDispatchPage />} />
          <Route path="/river/closure" element={<RiverClosurePage />} />

          <Route path="/heavy-rain" element={<DomainBoardPage domain="heavy-rain" />} />
          <Route path="/heavy-rain/dashboard" element={<HeavyRainHomePage />} />
          <Route path="/heavy-rain/data" element={<HeavyRainDataPage />} />
          <Route path="/heavy-rain/analysis" element={<HeavyRainAnalysisPage />} />
          <Route path="/heavy-rain/alert" element={<HeavyRainAlertPage />} />
          <Route path="/heavy-rain/closure" element={<HeavyRainClosurePage />} />

          <Route path="/typhoon" element={<DomainBoardPage domain="typhoon" />} />
          <Route path="/typhoon/dashboard" element={<TyphoonHomePage />} />
          <Route path="/typhoon/data" element={<TyphoonDataPage />} />
          <Route path="/typhoon/analysis" element={<TyphoonAnalysisPage />} />
          <Route path="/typhoon/alert" element={<TyphoonAlertPage />} />
          <Route path="/typhoon/closure" element={<TyphoonClosurePage />} />

          <Route path="/heat" element={<DomainBoardPage domain="heat" />} />
          <Route path="/heat/dashboard" element={<HeatHomePage />} />
          <Route path="/heat/data" element={<HeatDataPage />} />
          <Route path="/heat/analysis" element={<HeatAnalysisPage />} />
          <Route path="/heat/alert" element={<HeatAlertPage />} />
          <Route path="/heat/closure" element={<HeatClosurePage />} />

          {HAZARD_IDS.flatMap((id) => [
            <Route key={`${id}`} path={`/${id}`} element={<DomainBoardPage domain={id} />} />,
            <Route key={`${id}-dashboard`} path={`/${id}/dashboard`} element={<HazardHomePage id={id} />} />,
            <Route key={`${id}-data`} path={`/${id}/data`} element={<HazardDataPage id={id} />} />,
            <Route key={`${id}-analysis`} path={`/${id}/analysis`} element={<HazardAnalysisPage id={id} />} />,
            <Route key={`${id}-alert`} path={`/${id}/alert`} element={<HazardAlertPage id={id} />} />,
            <Route key={`${id}-closure`} path={`/${id}/closure`} element={<HazardClosurePage id={id} />} />,
          ])}

          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/propagation" element={<PropagationHomePage />} />
          <Route path="/data-systems" element={<DataSystemPage />} />
          <Route path="/esop" element={<EsopPage />} />
          <Route path="/dummy-data" element={<DummyDataPage />} />
          <Route path="/demo-version" element={<DemoVersionPage />} />
          <Route path="/pilot-status" element={<PilotStatusPage />} />
          <Route path="/vlm" element={<VlmPage />} />
          <Route path="/ax-hub" element={<AxHubPage />} />

          <Route path="/reports" element={<ReportsListPage />} />
          <Route path="/reports/:incidentId" element={<ReportDetailPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
    </>
  )
}
