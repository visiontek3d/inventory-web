import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center flex-1 p-8 gap-8">
        {/* Logo + heading */}
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo.png"
            alt="VisionTek3D Logo"
            className="w-40 h-40 object-contain"
          />
          <h1 className="text-white text-3xl font-bold text-center">
            Inventory Management
          </h1>
          <p className="text-[#7A7A7A] text-sm">VisionTek3D</p>
        </div>

        {/* Navigation cards */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
          <button
            onClick={() => navigate('/dioramas')}
            className="flex-1 bg-[#1e1e1e] border border-[#333333] hover:border-[#0086A3]
                       rounded-lg p-8 flex flex-col items-center gap-3 transition-colors group"
          >
            <svg
              className="w-12 h-12 text-[#0086A3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 7h18M3 12h18M3 17h18M6 4v16M18 4v16"
              />
            </svg>
            <span className="text-white text-xl font-semibold group-hover:text-[#0086A3] transition-colors">
              Diorama
            </span>
            <span className="text-[#7A7A7A] text-sm text-center">
              Manage diorama inventory
            </span>
          </button>

          <button
            onClick={() => navigate('/lifts')}
            className="flex-1 bg-[#1e1e1e] border border-[#333333] hover:border-[#0086A3]
                       rounded-lg p-8 flex flex-col items-center gap-3 transition-colors group"
          >
            <svg
              className="w-12 h-12 text-[#0086A3]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M5 10l7-7 7 7M5 20l7-7 7 7"
              />
            </svg>
            <span className="text-white text-xl font-semibold group-hover:text-[#0086A3] transition-colors">
              Lift
            </span>
            <span className="text-[#7A7A7A] text-sm text-center">
              Manage lift inventory
            </span>
          </button>
        </div>
      </div>
    </Layout>
  );
}
