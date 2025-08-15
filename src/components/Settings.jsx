import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Building, KeyRound, Upload, RefreshCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import * as bcrypt from 'bcryptjs';

const ResetCredentialDialog = ({ type, onReset }) => {
    const [newData, setNewData] = useState({ new: '', confirm: '' });
    const { toast } = useToast();

    const handleReset = () => {
        if (newData.new !== newData.confirm) {
            toast({ title: 'Error', description: `New ${type}s do not match.`, variant: 'destructive' });
            return;
        }
        if (!newData.new) {
             toast({ title: 'Error', description: `New ${type} cannot be empty.`, variant: 'destructive' });
            return;
        }
        onReset(newData.new);
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reset {type}</DialogTitle>
                <DialogDescription>
                    You are about to reset your {type}. This action doesn't require the old {type}.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div>
                    <Label htmlFor={`new-${type}`}>New {type}</Label>
                    <Input id={`new-${type}`} type="password" value={newData.new} onChange={e => setNewData({...newData, new: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor={`confirm-${type}`}>Confirm New {type}</Label>
                    <Input id={`confirm-${type}`} type="password" value={newData.confirm} onChange={e => setNewData({...newData, confirm: e.target.value})} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => document.querySelector('[data-state="open"]')?.click()}>Cancel</Button>
                <Button onClick={handleReset}>Reset {type}</Button>
            </DialogFooter>
        </DialogContent>
    );
};


function Settings() {
  const { data, updateData } = useData();
  const { settings } = data;
  const { toast } = useToast();
  const logoInputRef = useRef(null);

  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passcodeData, setPasscodeData] = useState({ currentPasscode: '', newPasscode: '', confirmPasscode: '' });
  const [companyData, setCompanyData] = useState({
    companyName: settings.companyName || '',
    companyLogo: settings.companyLogo || ''
  });

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (settings.password && !bcrypt.compareSync(currentPassword, settings.password)) {
      toast({ title: 'Error', description: 'Incorrect current password.', variant: 'destructive' });
      return;
    }
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    updateData({ settings: { ...settings, password: hashedPassword } });
    toast({ title: 'Success', description: 'Password updated successfully!' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };
  
  const handleResetPassword = (newPassword) => {
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    updateData({ settings: { ...settings, password: hashedPassword } });
    toast({ title: 'Success', description: 'Password has been reset.' });
    document.querySelector('[data-state="open"]')?.click(); // Close dialog
  };

  const handlePasscodeChange = (e) => {
    e.preventDefault();
    const { currentPasscode, newPasscode, confirmPasscode } = passcodeData;
    if (newPasscode !== confirmPasscode) {
      toast({ title: 'Error', description: 'New passcodes do not match.', variant: 'destructive' });
      return;
    }
    if (settings.passcode && !bcrypt.compareSync(currentPasscode, settings.passcode)) {
      toast({ title: 'Error', description: 'Incorrect current passcode.', variant: 'destructive' });
      return;
    }
    const hashedPasscode = bcrypt.hashSync(newPasscode, 10);
    updateData({ settings: { ...settings, passcode: hashedPasscode } });
    toast({ title: 'Success', description: 'Transaction passcode updated successfully!' });
    setPasscodeData({ currentPasscode: '', newPasscode: '', confirmPasscode: '' });
  };

  const handleResetPasscode = (newPasscode) => {
    const hashedPasscode = bcrypt.hashSync(newPasscode, 10);
    updateData({ settings: { ...settings, passcode: hashedPasscode } });
    toast({ title: 'Success', description: 'Passcode has been reset.' });
    document.querySelector('[data-state="open"]')?.click(); // Close dialog
  };
  
  const handleBrandingChange = (e) => {
    e.preventDefault();
    updateData({ settings: { ...settings, ...companyData } });
    toast({ title: 'Success', description: 'Company branding updated successfully!' });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCompanyData({...companyData, companyLogo: reader.result });
        };
        reader.readAsDataURL(file);
    } else {
        toast({ title: 'Error', description: 'Please select a valid image file.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage application settings, security, and branding.</p>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="branding">Company Branding</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="branding">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building /> Company Branding</CardTitle>
                <CardDescription>Customize the look and feel of the application to match your brand.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBrandingChange} className="space-y-6">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input id="companyName" value={companyData.companyName} onChange={e => setCompanyData({ ...companyData, companyName: e.target.value })} />
                  </div>
                  <div>
                    <Label>Company Logo</Label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                            {companyData.companyLogo ? (
                                <img src={companyData.companyLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Building className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>
                        <Button type="button" variant="outline" onClick={() => logoInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" /> Upload Logo
                        </Button>
                        <Input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    </div>
                  </div>
                  <Button type="submit">Save Branding</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        <TabsContent value="security">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lock /> Login Password</CardTitle>
                <CardDescription>Change the password used to log in to the application.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {settings.password && (
                    <div><Label htmlFor="currentPassword">Current Password</Label><Input id="currentPassword" type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })} /></div>
                  )}
                  <div><Label htmlFor="newPassword">New Password</Label><Input id="newPassword" type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} /></div>
                  <div><Label htmlFor="confirmPassword">Confirm New Password</Label><Input id="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} /></div>
                  <div className="flex items-center justify-between">
                    <Button type="submit">Update Password</Button>
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button type="button" variant="link" className="p-0 h-auto">Forgot password?</Button>
                        </DialogTrigger>
                        <ResetCredentialDialog type="password" onReset={handleResetPassword} />
                    </Dialog>
                  </div>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound /> Transaction Passcode</CardTitle>
                <CardDescription>Set a passcode to authorize editing or deleting transactions for added security.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasscodeChange} className="space-y-4">
                  {settings.passcode && (
                    <div><Label htmlFor="currentPasscode">Current Passcode</Label><Input id="currentPasscode" type="password" value={passcodeData.currentPasscode} onChange={e => setPasscodeData({ ...passcodeData, currentPasscode: e.target.value })} /></div>
                  )}
                  <div><Label htmlFor="newPasscode">New Passcode</Label><Input id="newPasscode" type="password" value={passcodeData.newPasscode} onChange={e => setPasscodeData({ ...passcodeData, newPasscode: e.target.value })} /></div>
                  <div><Label htmlFor="confirmPasscode">Confirm New Passcode</Label><Input id="confirmPasscode" type="password" value={passcodeData.confirmPasscode} onChange={e => setPasscodeData({ ...passcodeData, confirmPasscode: e.target.value })} /></div>
                   <div className="flex items-center justify-between">
                        <Button type="submit">Update Passcode</Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button type="button" variant="link" className="p-0 h-auto">Forgot passcode?</Button>
                            </DialogTrigger>
                            <ResetCredentialDialog type="passcode" onReset={handleResetPasscode} />
                        </Dialog>
                    </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Settings;