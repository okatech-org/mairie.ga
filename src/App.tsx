import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DashboardLayout from './layouts/DashboardLayout';
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { DemoProvider } from "@/contexts/DemoContext";
import { ThemeProvider } from "@/components/theme-provider";
import { CallProvider } from "@/contexts/CallContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PresentationProvider } from "@/contexts/PresentationContext";
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
import SuperAdminIAsted from "./pages/dashboard/super-admin/SuperAdminIAsted";
import SuperAdminKnowledgeBase from "./pages/dashboard/super-admin/SuperAdminKnowledgeBase";
import SuperAdminAnalytics from "./pages/dashboard/super-admin/SuperAdminAnalytics";
import MaireDashboard from "./pages/dashboard/MaireDashboard";
import MaireAnalyticsPage from "./pages/dashboard/maire/MaireAnalyticsPage";
import MaireBudgetPage from "./pages/dashboard/maire/MaireBudgetPage";
import MaireDeliberationsPage from "./pages/dashboard/maire/MaireDeliberationsPage";
import MaireArretesPage from "./pages/dashboard/maire/MaireArretesPage";
import MaireAgendaPage from "./pages/dashboard/maire/MaireAgendaPage";
import MaireUrbanismePage from "./pages/dashboard/maire/MaireUrbanismePage";
import MaireDocumentsPage from "./pages/dashboard/maire/MaireDocumentsPage";
import CorrespondancePage from "./pages/CorrespondancePage";

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
import DashboardServicesPage from './pages/dashboard/DashboardServicesPage';
import SettingsPage from './pages/SettingsPage';
import MessagingPage from "./pages/MessagingPage";
import IAstedInterfaceWrapper from "@/components/iasted/IAstedInterfaceWrapper";
import ServicesCatalog from "./pages/ServicesCatalog";
import Sensibilisation from "./pages/Sensibilisation";
import MentionsLegales from "./pages/MentionsLegales";
import PolitiqueConfidentialite from "./pages/PolitiqueConfidentialite";
import CGU from "./pages/CGU";
import ArretesPublicsPage from "./pages/ArretesPublicsPage";
import { InactivityHandler } from "@/components/auth/InactivityHandler";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <DemoProvider>
            <CallProvider>
              <PresentationProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <InactivityHandler />
                  <Routes>
                    {/* PUBLIC PORTAL (Citizens) */}
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<Home />} />
                      <Route path="/services" element={<ServicesCatalog />} />
                      <Route path="/sensibilisation" element={<Sensibilisation />} />
                      <Route path="/mentions-legales" element={<MentionsLegales />} />
                      <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
                      <Route path="/cgu" element={<CGU />} />
                      <Route path="/arretes" element={<ArretesPublicsPage />} />

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
                    <Route path="/correspondance" element={<CorrespondancePage />} />
                    <Route path="/settings" element={<SettingsPage />} />

                    {/* DASHBOARDS (Protected in real app) */}

                    {/* Citizen Dashboard Layout Route */}
                    <Route path="/dashboard/citizen" element={<DashboardLayout><Outlet /></DashboardLayout>}>
                      <Route index element={<CitizenDashboard />} />
                      <Route path="requests" element={<CitizenRequestsPage />} />
                      <Route path="services" element={<ServicesCatalog />} />
                      <Route path="associations" element={<CitizenAssociationsPage />} />
                      <Route path="companies" element={<CitizenCompaniesPage />} />
                      <Route path="cv" element={<CitizenCVPage />} />
                      <Route path="documents" element={<CitizenDocumentsPage />} />
                      <Route path="settings" element={<CitizenSettingsPage />} />
                      <Route path="child/:childId" element={<ChildRegistrationPage />} />
                    </Route>

                    <Route path="/dashboard/foreigner" element={<DashboardLayout><ForeignerDashboard /></DashboardLayout>} />

                    {/* Services Catalog (accessible from sidebar) */}
                    <Route path="/dashboard/services" element={<DashboardLayout><DashboardServicesPage /></DashboardLayout>} />

                    {/* Super Admin Routes */}
                    <Route path="/dashboard/super-admin" element={<DashboardLayout><SuperAdminDashboard /></DashboardLayout>} />
                    <Route path="/dashboard/super-admin/organizations" element={<DashboardLayout><SuperAdminOrganizations /></DashboardLayout>} />
                    <Route path="/dashboard/super-admin/organizations/:entityId" element={<DashboardLayout><OrganizationDetails /></DashboardLayout>} />
                    <Route path="/dashboard/super-admin/users" element={<DashboardLayout><SuperAdminUsers /></DashboardLayout>} />
                    <Route path="/dashboard/super-admin/services" element={<DashboardLayout><SuperAdminServices /></DashboardLayout>} />
                    <Route path="/dashboard/super-admin/settings" element={<DashboardLayout><SuperAdminSettings /></DashboardLayout>} />
                    <Route path="/dashboard/super-admin/iasted" element={<DashboardLayout><SuperAdminIAsted /></DashboardLayout>} />
                    <Route path="/dashboard/super-admin/knowledge-base" element={<DashboardLayout><SuperAdminKnowledgeBase /></DashboardLayout>} />
                    <Route path="/dashboard/super-admin/analytics" element={<DashboardLayout><SuperAdminAnalytics /></DashboardLayout>} />

                    {/* Municipal Personnel Routes */}
                    <Route path="/dashboard/maire" element={<DashboardLayout><MaireDashboard /></DashboardLayout>} />
                    <Route path="/dashboard/maire/analytics" element={<DashboardLayout><MaireAnalyticsPage /></DashboardLayout>} />
                    <Route path="/dashboard/maire/budget" element={<DashboardLayout><MaireBudgetPage /></DashboardLayout>} />
                    <Route path="/dashboard/maire/deliberations" element={<DashboardLayout><MaireDeliberationsPage /></DashboardLayout>} />
                    <Route path="/dashboard/maire/arretes" element={<DashboardLayout><MaireArretesPage /></DashboardLayout>} />
                    <Route path="/dashboard/maire/agenda" element={<DashboardLayout><MaireAgendaPage /></DashboardLayout>} />
                    <Route path="/dashboard/maire/urbanisme" element={<DashboardLayout><MaireUrbanismePage /></DashboardLayout>} />
                    <Route path="/dashboard/maire/documents" element={<DashboardLayout><MaireDocumentsPage /></DashboardLayout>} />
                    <Route path="/dashboard/sg" element={<DashboardLayout><AgentDashboard /></DashboardLayout>} />
                    <Route path="/dashboard/chef-service" element={<DashboardLayout><AgentDashboard /></DashboardLayout>} />

                    {/* Agent Routes */}
                    <Route path="/dashboard/agent" element={<DashboardLayout><AgentDashboard /></DashboardLayout>} />
                    <Route path="/dashboard/agent/appointments" element={<DashboardLayout><AgentAppointmentsPage /></DashboardLayout>} />
                    <Route path="/dashboard/agent/requests" element={<DashboardLayout><AgentRequestsPage /></DashboardLayout>} />

                    {/* Consul General / Admin Routes */}
                    <Route path="/dashboard/admin/agents" element={<DashboardLayout><AgentsPage /></DashboardLayout>} />
                    <Route path="/dashboard/admin/settings" element={<DashboardLayout><OrganizationSettingsPage /></DashboardLayout>} />

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
              </PresentationProvider>
            </CallProvider>
          </DemoProvider>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
