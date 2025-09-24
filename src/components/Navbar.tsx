import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded hover:bg-gray-200 transition ${isActive ? 'bg-gray-300 font-semibold' : ''}`

  return (
    <nav className=" shadow p-4 flex gap-4" style={{ backgroundColor: 'black' }}>
      <NavLink to="/" className={linkClass} end>
        Home
      </NavLink>
      <NavLink to="/jobs" className={linkClass}>
        Jobs
      </NavLink>
      <NavLink to="/candidates" className={linkClass}>
        Candidates
      </NavLink>
    </nav>
  )
}
