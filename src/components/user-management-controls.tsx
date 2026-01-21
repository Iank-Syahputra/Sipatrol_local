'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Printer, Search, Plus } from 'lucide-react';
import Link from 'next/link';

interface UserManagementControlsProps {
  initialSearchTerm: string;
}

export default function UserManagementControls({ 
  initialSearchTerm 
}: UserManagementControlsProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    // Debounce the search
    const params = new URLSearchParams();
    if (value) {
      params.set('search', value);
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleAddUser = () => {
    router.push('/admin/users/create');
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality would go here');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Header Buttons */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      {/* Search and Add Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          </div>

          <Link
            href="/admin/users/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            <Plus className="h-4 w-4" />
            Add New User
          </Link>
        </div>
      </div>
    </>
  );
}