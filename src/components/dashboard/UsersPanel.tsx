import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { fetchUsers, User } from "@/lib/firebaseServices";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

const UsersPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchUsers(20),
  });
  
  const filteredUsers = users.filter((user: User) => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="p-6 bg-white shadow-md border-2 border-[#0da54b]/20">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <Button className="flex items-center gap-2 bg-[#0da54b] hover:bg-[#0da54b]/90">
          <UserPlus size={16} />
          <span>Add User</span>
        </Button>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search users..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <TableRow key={`loading-${i}`}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-12" /></TableCell>
                </TableRow>
              ))}
            </>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-red-500">
                Error loading user data. Please try again later.
              </TableCell>
            </TableRow>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user: User) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name || 'N/A'}</TableCell>
                <TableCell>{user.role || 'N/A'}</TableCell>
                <TableCell>{user.location || 'N/A'}</TableCell>
                <TableCell>{user.joinDate || 'N/A'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">
                {searchTerm ? 'No users match your search.' : 'No users found. Add users to get started.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default UsersPanel;
