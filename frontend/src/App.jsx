import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import TutorHome from './pages/TutorHome.jsx'
import GapReport from './pages/GapReport.jsx'
import Owner from './pages/Owner.jsx'
import Pricing from './pages/Pricing.jsx'
import PilotSuccess from './pages/PilotSuccess.jsx'
import StudentHome from './pages/StudentHome.jsx'
import Mission from './pages/Mission.jsx'
import AdminReset from './pages/AdminReset.jsx'
import NotFound from './pages/NotFound.jsx'
import { FrameSync, PlayRoute } from './components/PhoneFrame.jsx'
import ParentRoute from './pages/parent/ParentApp.jsx'
import { StudioScope } from './staff/StudioShell.jsx'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <FrameSync />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/tutor" element={<TutorHome />} />
        <Route path="/tutor/students/:id" element={<TutorHome />} />
        <Route path="/tutor/report/:sessionId" element={<StudioScope><GapReport /></StudioScope>} />
        <Route path="/owner" element={<Owner />} />
        <Route path="/owner/pricing" element={<StudioScope><Pricing /></StudioScope>} />
        <Route path="/pricing" element={<StudioScope><Pricing /></StudioScope>} />
        <Route path="/parent" element={<ParentRoute />} />
        <Route path="/pilot/success" element={<PilotSuccess />} />
        <Route path="/student" element={<PlayRoute><StudentHome /></PlayRoute>} />
        <Route path="/student/mission/:sessionId" element={<PlayRoute><Mission /></PlayRoute>} />
        <Route path="/admin/reset" element={<AdminReset />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
