'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Users, 
  Plus, 
  Mail, 
  Shield, 
  UserCheck, 
  UserX,
  MoreVertical,
  Crown,
  UserCog,
  Eye
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  last_active_at: string;
  created_at: string;
}

const roles = [
  { value: 'owner', label: 'Owner', icon: Crown, description: 'Full access to everything' },
  { value: 'admin', label: 'Admin', icon: Shield, description: 'Can manage most things' },
  { value: 'manager', label: 'Manager', icon: UserCog, description: 'Can manage leads & campaigns' },
  { value: 'member', label: 'Member', icon: UserCheck, description: 'Can view and create leads' },
  { value: 'viewer', label: 'Viewer', icon: Eye, description: 'View-only access' },
];

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [planLimits, setPlanLimits] = useState({ allowed: 1, current: 0, unlimited: false });
  const [isLoading, setIsLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const supabase = createClient();

  useEffect(() => {
    loadTeamData();
  }, []);

  async function loadTeamData() {
    setIsLoading(true);
    try {
      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Load plan limits
      const { data: planData, error: planError } = await supabase
        .from('tenants')
        .select('plan:plan_id(team_members_allowed, team_members_unlimited)')
        .single();

      if (planError) throw planError;
      
      const activeCount = membersData?.filter(m => m.status === 'active').length || 0;
      setPlanLimits({
        allowed: planData?.plan?.team_members_allowed || 1,
        current: activeCount,
        unlimited: planData?.plan?.team_members_unlimited || false,
      });
    } catch (error) {
      console.error('Error loading team:', error);
      toast.error('Failed to load team data');
    } finally {
      setIsLoading(false);
    }
  }

  async function inviteMember() {
    if (!inviteEmail || !inviteName) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check plan limits
    if (!planLimits.unlimited && planLimits.current >= planLimits.allowed) {
      toast.error(`Team limit reached (${planLimits.allowed} members). Upgrade your plan to add more.`);
      return;
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
          status: 'invited',
          invitation_token: Math.random().toString(36).substring(2),
          invitation_sent_at: new Date().toISOString(),
          invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (error) throw error;

      toast.success('Invitation sent!');
      setShowInvite(false);
      setInviteEmail('');
      setInviteName('');
      loadTeamData();
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  }

  async function updateRole(memberId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Role updated!');
      loadTeamData();
    } catch (error) {
      toast.error('Failed to update role');
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'removed' })
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Member removed');
      loadTeamData();
    } catch (error) {
      toast.error('Failed to remove member');
    }
  }

  function getRoleIcon(role: string) {
    const roleDef = roles.find(r => r.value === role);
    const Icon = roleDef?.icon || UserCheck;
    return <Icon className="h-4 w-4" />;
  }

  function getRoleLabel(role: string) {
    return roles.find(r => r.value === role)?.label || role;
  }

  if (isLoading) {
    return <div className="p-8 text-center text-[#64748B]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F5F9]">Team Management</h1>
          <p className="text-[#94A3B8] mt-1">
            Manage team members and their permissions
          </p>
        </div>
        <Button 
          className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
          onClick={() => setShowInvite(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Plan Usage */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#94A3B8]">Team Members</p>
              <p className="text-2xl font-bold text-[#F1F5F9]">
                {planLimits.current}
                {!planLimits.unlimited && (
                  <span className="text-[#64748B] text-lg"> / {planLimits.allowed}</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#94A3B8]">Plan</p>
              <p className="text-[#F1F5F9]">
                {planLimits.unlimited ? 'Unlimited' : `${planLimits.allowed} members`}
              </p>
            </div>
          </div>
          {!planLimits.unlimited && (
            <div className="mt-3">
              <div className="h-2 bg-[#2A2D38] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#5B4FFF] transition-all"
                  style={{ width: `${(planLimits.current / planLimits.allowed) * 100}%` }}
                />
              </div>
              {planLimits.current >= planLimits.allowed && (
                <p className="text-xs text-yellow-400 mt-2">
                  Team limit reached. <a href="/admin/settings/plans" className="underline">Upgrade plan</a> to add more members.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Form */}
      {showInvite && (
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardHeader>
            <CardTitle className="text-[#F1F5F9]">Invite Team Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Name</label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Doe"
                  className="bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>
              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Email</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="bg-[#0E0F12] border-[#2A2D38]"
                />
              </div>
              <div>
                <label className="text-sm text-[#F1F5F9] mb-1 block">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full bg-[#0E0F12] border border-[#2A2D38] rounded p-2 text-[#F1F5F9]"
                >
                  {roles.filter(r => r.value !== 'owner').map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                className="bg-[#5B4FFF] hover:bg-[#5B4FFF]/90"
                onClick={inviteMember}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
              <Button 
                variant="outline" 
                className="border-[#2A2D38]"
                onClick={() => setShowInvite(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members List */}
      <Card className="bg-[#16181D] border-[#2A2D38]">
        <CardHeader>
          <CardTitle className="text-[#F1F5F9]">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-3 bg-[#0E0F12] rounded-lg border border-[#2A2D38]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#5B4FFF]/10 flex items-center justify-center">
                    <span className="text-[#5B4FFF] font-bold">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-[#F1F5F9]">{member.name}</p>
                    <p className="text-sm text-[#64748B]">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <span className="text-sm text-[#94A3B8]">
                      {getRoleLabel(member.role)}
                    </span>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded ${
                    member.status === 'active' ? 'bg-green-500/10 text-green-400' :
                    member.status === 'invited' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {member.status}
                  </span>

                  {member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#16181D] border-[#2A2D38]">
                        <DropdownMenuItem 
                          className="text-[#F1F5F9] focus:bg-[#2A2D38]"
                          onClick={() => updateRole(member.id, 'admin')}
                        >
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-[#F1F5F9] focus:bg-[#2A2D38]"
                          onClick={() => updateRole(member.id, 'manager')}
                        >
                          Make Manager
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-[#F1F5F9] focus:bg-[#2A2D38]"
                          onClick={() => updateRole(member.id, 'member')}
                        >
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-400 focus:bg-[#2A2D38]"
                          onClick={() => removeMember(member.id)}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}

            {members.length === 0 && (
              <div className="text-center py-8 text-[#64748B]">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No team members yet</p>
                <p className="text-sm">Invite your team to collaborate</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card className="bg-[#0E0F12] border-[#2A2D38]">
        <CardContent className="p-4">
          <h3 className="font-medium text-[#F1F5F9] mb-3">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {roles.map((role) => (
              <div key={role.value} className="p-3 bg-[#16181D] rounded border border-[#2A2D38]">
                <div className="flex items-center gap-2 mb-1">
                  <role.icon className="h-4 w-4 text-[#5B4FFF]" />
                  <span className="font-medium text-[#F1F5F9]">{role.label}</span>
                </div>
                <p className="text-xs text-[#64748B]">{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
