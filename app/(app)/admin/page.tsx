'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, 
  Building2, 
  CreditCard, 
  Activity,
  ArrowRight,
  Shield,
  Server,
  UserPlus,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  is_active: boolean;
  created_at: string;
  owner_email?: string;
}

interface RecentUser {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  created_at: string;
  is_superadmin: boolean;
}

interface Stats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  activeUsers: number;
}

export default function AdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Load recent users (last 10 signups)
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, company, created_at, is_superadmin')
        .order('created_at', { ascending: false })
        .limit(10);

      if (usersError) throw usersError;
      setRecentUsers(usersData || []);

      // Load stats
      const { count: totalTenants } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true });

      const { count: activeTenants } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setStats({
        totalTenants: totalTenants || 0,
        activeTenants: activeTenants || 0,
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Super Admin</h1>
          <p className="text-[#64748B]">Manage tenants and system settings</p>
        </div>
        <Badge className="bg-[#5B4FFF]/20 text-[#5B4FFF] border-[#5B4FFF]/30">
          <Shield className="h-3 w-3 mr-1" />
          Super Admin
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-[#5B4FFF]" />
              <span className="text-sm text-[#64748B]">Total Tenants</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{stats.totalTenants}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm text-[#64748B]">Active Tenants</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{stats.activeTenants}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-[#5B4FFF]" />
              <span className="text-sm text-[#64748B]">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{stats.totalUsers}</p>
          </CardContent>
        </Card>

        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-green-500" />
              <span className="text-sm text-[#64748B]">Active Users</span>
            </div>
            <p className="text-2xl font-bold text-[#F1F5F9]">{stats.activeUsers}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenants List */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <Server className="h-5 w-5 text-[#5B4FFF]" />
              Recent Tenants
            </CardTitle>
            <Link href="/admin/tenants">
              <Button variant="outline" size="sm" className="border-[#2A2D38]">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tenants.slice(0, 5).map((tenant) => (
                <div 
                  key={tenant.id}
                  className="flex items-center justify-between p-3 bg-[#0E0F12] rounded-lg border border-[#2A2D38]"
                >
                  <div>
                    <p className="font-medium text-[#F1F5F9]">{tenant.name}</p>
                    <p className="text-sm text-[#64748B]">{tenant.subdomain}.funnelswift.com</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={tenant.is_active ? 'default' : 'secondary'}
                      className={tenant.is_active ? 'bg-green-500/20 text-green-400' : 'bg-[#2A2D38] text-[#64748B]'}
                    >
                      {tenant.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className="bg-[#5B4FFF]/20 text-[#5B4FFF]">
                      {tenant.plan}
                    </Badge>
                  </div>
                </div>
              ))}
              {tenants.length === 0 && (
                <p className="text-center text-[#64748B] py-8">No tenants found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#F1F5F9] flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-500" />
              Recent Signups
            </CardTitle>
            <Link href="/admin/users">
              <Button variant="outline" size="sm" className="border-[#2A2D38]">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentUsers.map((user) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-[#0E0F12] rounded-lg border border-[#2A2D38]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#5B4FFF]/20 rounded-full flex items-center justify-center">
                      <Mail className="h-4 w-4 text-[#5B4FFF]" />
                    </div>
                    <div>
                      <p className="font-medium text-[#F1F5F9]">
                        {user.full_name || user.email.split('@')[0]}
                      </p>
                      <p className="text-sm text-[#64748B]">{user.email}</p>
                      {user.company && (
                        <p className="text-xs text-[#64748B]">{user.company}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#64748B]">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    {user.is_superadmin && (
                      <Badge className="bg-[#5B4FFF]/20 text-[#5B4FFF] text-xs mt-1">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="text-center text-[#64748B] py-8">No recent signups</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/settings/system">
          <Card className="bg-[#16181D] border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#5B4FFF]/20 rounded-lg">
                  <Server className="h-5 w-5 text-[#5B4FFF]" />
                </div>
                <div>
                  <p className="font-medium text-[#F1F5F9]">System Settings</p>
                  <p className="text-sm text-[#64748B]">Configure global settings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/affiliates">
          <Card className="bg-[#16181D] border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#5B4FFF]/20 rounded-lg">
                  <Users className="h-5 w-5 text-[#5B4FFF]" />
                </div>
                <div>
                  <p className="font-medium text-[#F1F5F9]">Affiliates</p>
                  <p className="text-sm text-[#64748B]">Manage affiliate program</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/settings/plans">
          <Card className="bg-[#16181D] border-[#2A2D38] hover:border-[#5B4FFF]/50 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#5B4FFF]/20 rounded-lg">
                  <CreditCard className="h-5 w-5 text-[#5B4FFF]" />
                </div>
                <div>
                  <p className="font-medium text-[#F1F5F9]">Plans & Pricing</p>
                  <p className="text-sm text-[#64748B]">Manage subscription plans</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
