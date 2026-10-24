import { Link } from 'react-router-dom'
import { Empty, Shell } from '../components/ui.jsx'

export default function NotFound() {
  return (
    <Shell>
      <div className="page page--narrow">
        <Empty face="🤔" title="Pip looked everywhere.">
          <p style={{ marginBottom: 16 }}>This page isn’t here. Pip takes that literally.</p>
          <Link className="btn" to="/">
            Back to start
          </Link>
        </Empty>
      </div>
    </Shell>
  )
}
