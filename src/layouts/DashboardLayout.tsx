import React, { useState, useMemo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse,
  Tooltip,
  Chip,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Receipt,
  Assessment,
  AccountBalanceWallet,
  Description,
  Settings,
  Notifications,
  Person,
  Logout,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  Brightness4,
  Brightness7,
  Search,
  AttachMoney,
  CreditCard,
  ShowChart,
  People,
  Security,
  Assignment,
  TrendingUp,
  AccountBalance,
  ReceiptLong,
  School,
  InsertChart,
  ListAlt,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useThemeMode } from '../contexts/ThemeContext';

const drawerWidth = 280;
const collapsedWidth = 80;

interface MenuItemType {
  title: string;
  icon: React.ReactElement;
  path: string;
  children?: MenuItemType[];
  badge?: number;
  roles?: ('ADMIN' | 'MERCHANT')[];
}

const DashboardLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleColorMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationEl, setNotificationEl] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Transactions']);

  const menuItems: MenuItemType[] = useMemo(() => {
    const baseItems: MenuItemType[] = [
      {
        title: 'Dashboard',
        icon: <Dashboard />,
        path: user?.role === 'ADMIN' ? '/admin/dashboard' : '/merchant/dashboard',
      },
      {
        title: 'Transactions',
        icon: <Receipt />,
        path: '/transactions',
        children: [
          {
            title: 'All Transactions',
            icon: <ReceiptLong />,
            path: '/transactions/all',
          },
          {
            title: 'Search Transaction',
            icon: <Search />,
            path: '/transactions/search',
          },
          {
            title: 'Success Rate',
            icon: <ShowChart />,
            path: '/transactions/success-graph',
          },
        ],
      },
      {
        title: 'Settlements',
        icon: <AccountBalanceWallet />,
        path: '/settlements',
        children: [
          {
            title: 'Settled Transactions',
            icon: <AttachMoney />,
            path: '/settlements/settled',
          },
          {
            title: 'Refunds',
            icon: <CreditCard />,
            path: '/settlements/refunds',
            badge: 5,
          },
          {
            title: 'Chargebacks',
            icon: <Assignment />,
            path: '/settlements/chargebacks',
            badge: 2,
          },
        ],
      },
      {
        title: 'Analytics',
        icon: <Assessment />,
        path: '/analytics',
        children: [
          {
            title: 'Overview',
            icon: <TrendingUp />,
            path: '/analytics/overview',
          },
          {
            title: 'Payment Modes',
            icon: <CreditCard />,
            path: '/analytics/payment-modes',
          },
          {
            title: 'Settlement Analytics',
            icon: <AccountBalance />,
            path: '/analytics/settlements',
          },
        ],
      },
      {
        title: 'Reports',
        icon: <Description />,
        path: '/reports',
        children: [
          {
            title: 'Generate Report',
            icon: <Assignment />,
            path: '/reports/generate',
          },
          {
            title: 'Report History',
            icon: <ReceiptLong />,
            path: '/reports/history',
          },
        ],
      },
    ];

    // Add admin-only items
    if (user?.role === 'ADMIN') {
      console.log('Adding QwikForms menu for ADMIN user:', user);
      baseItems.push(
        {
          title: 'QwikForms',
          icon: <School />,
          path: '/qwikforms',
          roles: ['ADMIN'],
          children: [
            {
              title: 'Transactions',
              icon: <ListAlt />,
              path: '/qwikforms/transactions',
            },
            {
              title: 'Settlements',
              icon: <AccountBalanceWallet />,
              path: '/qwikforms/settlements',
            },
            {
              title: 'Analytics',
              icon: <InsertChart />,
              path: '/qwikforms/analytics',
            },
            {
              title: 'Reports',
              icon: <Description />,
              path: '/qwikforms/reports',
            },
          ],
        },
        {
          title: 'Merchants',
          icon: <People />,
          path: '/merchants',
          roles: ['ADMIN'],
        },
        {
          title: 'Security',
          icon: <Security />,
          path: '/security',
          roles: ['ADMIN'],
        }
      );
    } else {
      console.log('QwikForms menu NOT added. Current user role:', user?.role);
    }

    baseItems.push({
      title: 'Settings',
      icon: <Settings />,
      path: '/settings',
    });

    return baseItems;
  }, [user]);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setDrawerOpen(!drawerOpen);
    }
  };

  const handleMenuClick = (item: MenuItemType) => {
    if (item.children) {
      const isExpanded = expandedMenus.includes(item.title);
      if (isExpanded) {
        setExpandedMenus(expandedMenus.filter(title => title !== item.title));
      } else {
        setExpandedMenus([...expandedMenus, item.title]);
      }
    } else {
      navigate(item.path);
      if (isMobile) {
        setMobileOpen(false);
      }
    }
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationEl(event.currentTarget);
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo Section */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: drawerOpen ? 'space-between' : 'center',
        }}
      >
        {drawerOpen && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}
            >
              <Typography sx={{ color: 'white', fontWeight: 'bold' }}>SP</Typography>
            </Box>
            <Typography variant="h6" fontWeight="bold">
              SabPaisa
            </Typography>
          </Box>
        )}
        {!isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <ChevronLeft />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* User Info */}
      {drawerOpen && (
        <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {user?.merchant_name || user?.username}
              </Typography>
              <Chip
                label={user?.role}
                size="small"
                color={user?.role === 'ADMIN' ? 'error' : 'primary'}
                sx={{ height: 20 }}
              />
            </Box>
          </Box>
        </Box>
      )}

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, px: drawerOpen ? 1 : 0 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path ||
                          location.pathname.startsWith(item.path + '/');
          const isExpanded = expandedMenus.includes(item.title);

          if (item.roles && !item.roles.includes(user?.role as any)) {
            return null;
          }

          return (
            <React.Fragment key={item.title}>
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={!drawerOpen ? item.title : ''} placement="right">
                  <ListItemButton
                    onClick={() => handleMenuClick(item)}
                    selected={isActive}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      justifyContent: drawerOpen ? 'initial' : 'center',
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: drawerOpen ? 2 : 'auto',
                        justifyContent: 'center',
                        color: isActive ? theme.palette.primary.main : 'inherit',
                      }}
                    >
                      <Badge badgeContent={item.badge} color="error">
                        {item.icon}
                      </Badge>
                    </ListItemIcon>
                    {drawerOpen && (
                      <>
                        <ListItemText primary={item.title} />
                        {item.children && (
                          isExpanded ? <ExpandLess /> : <ExpandMore />
                        )}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>

              {drawerOpen && item.children && (
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <ListItem key={child.title} disablePadding sx={{ pl: 2 }}>
                          <ListItemButton
                            onClick={() => handleMenuClick(child)}
                            selected={isChildActive}
                            sx={{
                              borderRadius: 1,
                              mx: 1,
                              '&.Mui-selected': {
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                              },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <Badge badgeContent={child.badge} color="error">
                                {child.icon}
                              </Badge>
                            </ListItemIcon>
                            <ListItemText primary={child.title} />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerOpen ? drawerWidth : collapsedWidth}px)` },
          ml: { md: `${drawerOpen ? drawerWidth : collapsedWidth}px` },
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            {user?.role === 'ADMIN' ? 'Admin Portal' : 'Merchant Portal'}
          </Typography>

          {/* Right side icons */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
            <IconButton color="inherit" onClick={toggleColorMode}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          <IconButton color="inherit" onClick={handleNotificationClick}>
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton onClick={handleProfileClick} sx={{ ml: 1 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerOpen ? drawerWidth : collapsedWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerOpen ? drawerWidth : collapsedWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 200 } }}
      >
        <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
          <ListItemIcon><Person fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate('/settings'); setAnchorEl(null); }}>
          <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { logout(); setAnchorEl(null); }}>
          <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerOpen ? drawerWidth : collapsedWidth}px)` },
          mt: 8,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;