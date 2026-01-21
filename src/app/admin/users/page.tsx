import { createClient } from '@supabase/supabase-js';
import AdminSidebar from '@/components/admin-sidebar';
import UserManagementTable from '@/components/user-management-table';
import UserManagementControls from '@/components/user-management-controls';

// Server component to fetch users and units
async function getUsersAndUnits(searchTerm: string = '') {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch users with their associated unit information
  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      username,
      phone_number,
      role,
      assigned_unit_id,
      created_at,
      units (id, name)
    `)
    .order('created_at', { ascending: false });

  // Apply search filter if provided
  if (searchTerm) {
    query = query.ilike('full_name', `%${searchTerm}%`);
  }

  const { data: users, error: usersError } = await query;

  if (usersError) {
    console.error('Error fetching users:', usersError);
    throw new Error('Failed to fetch users');
  }

  // Fetch all units for the dropdown
  const { data: units, error: unitsError } = await supabase
    .from('units')
    .select('id, name')
    .order('name', { ascending: true });

  if (unitsError) {
    console.error('Error fetching units:', unitsError);
    throw new Error('Failed to fetch units');
  }

  return { users, units };
}

export default async function ManageUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const searchTerm = params?.search as string || '';
  const { users, units } = await getUsersAndUnits(searchTerm);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Manage Users</h1>
            {/* Export/Print buttons moved to Client Component */}
            <UserManagementControls initialSearchTerm={searchTerm} />
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Users Table */}
          <UserManagementTable
            initialUsers={users}
            initialUnits={units}
          />
        </div>
      </div>
    </div>
  );
}