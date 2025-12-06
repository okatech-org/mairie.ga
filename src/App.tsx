import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardLayout from './layouts/DashboardLayout';
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { DemoProvider } from "@/contexts/DemoContext";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Home from "./pages/Home";
import Actualites from "./pages/Actualites";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DemoPortal from "./pages/DemoPortal";
import EntityPortal from "./pages/EntityPortal";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import RegistrationChoice from "./pages/auth/RegistrationChoice";
import RegisterGabonais from "./pages/auth/RegisterGabonais";
import RegisterForeigner from "./pages/auth/RegisterForeigner";
import CitizenDashboard from "./pages/dashboard/CitizenDashboard";
import ForeignerDashboard from "./pages/dashboard/ForeignerDashboard";
import ChildRegistrationPage from "./pages/registration/ChildRegistrationPage";
import SuperAdminDashboard from "./pages/dashboard/SuperAdminDashboard";
import SuperAdminOrganizations from "./pages/dashboard/super-admin/SuperAdminOrganizations";
import OrganizationDetails from "./pages/dashboard/super-admin/OrganizationDetails";
import SuperAdminUsers from "./pages/dashboard/super-admin/SuperAdminUsers";
import SuperAdminServices from "./pages/dashboard/super-admin/SuperAdminServices";
import SuperAdminSettings from "./pages/dashboard/super-admin/SuperAdminSettings";
import AgentDashboard from "./pages/dashboard/AgentDashboard";
import AgentAppointmentsPage from "./pages/dashboard/agent/AgentAppointmentsPage";
import AgentRequestsPage from "./pages/dashboard/agent/AgentRequestsPage";
import AgentsPage from "./pages/dashboard/admin/AgentsPage";
import OrganizationSettingsPage from "./pages/dashboard/admin/OrganizationSettingsPage";

import CompaniesPage from "./pages/companies/CompaniesPage";
import NewCompanyPage from "./pages/companies/NewCompanyPage";
import CompanyDetailsPage from "./pages/companies/CompanyDetailsPage";
import AssociationsPage from "./pages/associations/AssociationsPage";
import NewAssociationPage from "./pages/associations/NewAssociationPage";
import AssociationDetailsPage from "./pages/associations/AssociationDetailsPage";

import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

import CitizenAssociationsPage from './pages/dashboard/citizen/CitizenAssociationsPage';
import CitizenCompaniesPage from './pages/dashboard/citizen/CitizenCompaniesPage';
import CitizenCVPage from './pages/dashboard/citizen/CitizenCVPage';
import CitizenDocumentsPage from './pages/dashboard/citizen/CitizenDocumentsPage';
import CitizenRequestsPage from './pages/dashboard/citizen/CitizenRequestsPage';
import CitizenSettingsPage from './pages/dashboard/citizen/CitizenSettingsPage';
import SettingsPage from './pages/SettingsPage';
import MessagingPage from "./pages/MessagingPage";
import IAstedInterfaceWrapper from "@/components/iasted/IAstedInterfaceWrapper";
import ServicesCatalog from "./pages/ServicesCatalog";
import Sensibilisation from "./pages/Sensibilisation";
import MentionsLegales from "./pages/MentionsLegales";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import CGU from "./pages/CGU";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <DemoProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* PUBLIC PORTAL (Citizens) */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/services" element={<ServicesCatalog />} />
                  <Route path="/sensibilisation" element={<Sensibilisation />} />
                  <Route path="/mentions-legales" element={<MentionsLegales />} />
                  <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
                  <Route path="/cgu" element={<CGU />} />
                  
                  <Route path="/actualites" element={<Actualites />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* REGISTRATION FLOW */}
                  <Route path="/register" element={<RegistrationChoice />} />
                  <Route path="/register/gabonais" element={<RegisterGabonais />} />
                  <Route path="/register/etranger" element={<RegisterForeigner />} />

                  <Route path="/portal/:entityId" element={<EntityPortal />} />

                  {/* COMPANIES & ASSOCIATIONS */}
                  <Route path="/companies" element={<CompaniesPage />} />
                  <Route path="/companies/new" element={<NewCompanyPage />} />
                  <Route path="/companies/:id" element={<CompanyDetailsPage />} />

                  <Route path="/associations" element={<AssociationsPage />} />
                  <Route path="/associations/new" element={<NewAssociationPage />} />
                  <Route path="/associations/:id" element={<AssociationDetailsPage />} />
                </Route>

                <Route path="/messaging" element={<MessagingPage />} />
                <Route path="/iboite" element={<MessagingPage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* DASHBOARDS (Protected in real app) */}

                {/* Citizen Dashboard Layout Route */}
                <Route path="/dashboard/citizen" element={<DashboardLayout><Outlet /></DashboardLayout>}>
                  <Route index element={<CitizenDashboard />} />
                  <Route path="requests" element={<CitizenRequestsPage />} />
                  <Route path="associations" element={<CitizenAssociationsPage />} />
                  <Route path="companies" element={<CitizenCompaniesPage />} />
                  <Route path="cv" element={<CitizenCVPage />} />
                  <Route path="documents" element={<CitizenDocumentsPage />} />
                  <Route path="settings" element={<CitizenSettingsPage />} />
                  <Route path="child/:childId" element={<ChildRegistrationPage />} />
                </Route>

                <Route path="/dashboard/foreigner" element={<ForeignerDashboard />} />
                <Route path="/dashboard/super-admin" element={<SuperAdminDashboard />} />
                <Route path="/dashboard/super-admin/organizations" element={<SuperAdminOrganizations />} />
                <Route path="/dashboard/super-admin/organizations/:entityId" element={<OrganizationDetails />} />
                <Route path="/dashboard/super-admin/users" element={<SuperAdminUsers />} />
                <Route path="/dashboard/super-admin/services" element={<SuperAdminServices />} />
                <Route path="/dashboard/super-admin/settings" element={<SuperAdminSettings />} />
                <Route path="/dashboard/agent" element={<AgentDashboard />} />
                <Route path="/dashboard/agent/appointments" element={<AgentAppointmentsPage />} />
                <Route path="/dashboard/agent/requests" element={<AgentRequestsPage />} />

                {/* Consul General / Admin Routes */}
                <Route path="/dashboard/admin/agents" element={<AgentsPage />} />
                <Route path="/dashboard/admin/settings" element={<OrganizationSettingsPage />} />

                {/* ADMIN PORTAL (Back-Office) */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                </Route>

                {/* DEMO & UTILS */}
                <Route path="/demo-portal" element={<DemoPortal />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <IAstedInterfaceWrapper />
            </BrowserRouter>
          </DemoProvider>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
