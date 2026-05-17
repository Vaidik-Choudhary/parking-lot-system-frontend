/**
 * Mock data used across all Playwright E2E tests.
 * Mirrors the shape of responses from the ParkEase backend APIs.
 */

// ── Auth ────────────────────────────────────────────────────────────────────
export const DRIVER_AUTH = {
  accessToken: 'mock-driver-jwt-token',
  refreshToken: 'mock-driver-refresh-token',
  role: 'DRIVER',
  email: 'driver@test.com',
  fullName: 'Test Driver',
  userId: 1,
};

export const MANAGER_AUTH = {
  accessToken: 'mock-manager-jwt-token',
  refreshToken: 'mock-manager-refresh-token',
  role: 'LOT_MANAGER',
  email: 'manager@test.com',
  fullName: 'Test Manager',
  userId: 2,
};

export const ADMIN_AUTH = {
  accessToken: 'mock-admin-jwt-token',
  refreshToken: 'mock-admin-refresh-token',
  role: 'ADMIN',
  email: 'admin@test.com',
  fullName: 'Test Admin',
  userId: 3,
};

// ── Lots ────────────────────────────────────────────────────────────────────
export const MOCK_LOTS = [
  {
    lotId: 1,
    name: 'MG Road Parking',
    address: '123 MG Road',
    city: 'Mumbai',
    latitude: 19.076,
    longitude: 72.877,
    totalSpots: 50,
    availableSpots: 30,
    open: true,
    approved: true,
    openTime: '08:00',
    closeTime: '22:00',
    imageUrl: '',
  },
  {
    lotId: 2,
    name: 'Koregaon Park Lot',
    address: '45 Lane 5',
    city: 'Pune',
    latitude: 18.536,
    longitude: 73.893,
    totalSpots: 100,
    availableSpots: 10,
    open: true,
    approved: true,
    openTime: '06:00',
    closeTime: '23:00',
    imageUrl: '',
  },
];

// ── Spots ───────────────────────────────────────────────────────────────────
export const MOCK_SPOTS = [
  { spotId: 1, spotNumber: 'A-1', floor: 1, status: 'AVAILABLE', spotType: 'FOUR_WHEELER', pricePerHour: 40, isEVCharging: false, isHandicapped: false },
  { spotId: 2, spotNumber: 'A-2', floor: 1, status: 'OCCUPIED', spotType: 'FOUR_WHEELER', pricePerHour: 40, isEVCharging: false, isHandicapped: false },
  { spotId: 3, spotNumber: 'A-3', floor: 1, status: 'AVAILABLE', spotType: 'TWO_WHEELER', pricePerHour: 20, isEVCharging: true, isHandicapped: false },
  { spotId: 4, spotNumber: 'B-1', floor: 2, status: 'RESERVED', spotType: 'FOUR_WHEELER', pricePerHour: 50, isEVCharging: false, isHandicapped: true },
  { spotId: 5, spotNumber: 'B-2', floor: 2, status: 'AVAILABLE', spotType: 'FOUR_WHEELER', pricePerHour: 50, isEVCharging: false, isHandicapped: false },
  { spotId: 6, spotNumber: 'B-3', floor: 2, status: 'MAINTENANCE', spotType: 'HEAVY', pricePerHour: 60, isEVCharging: false, isHandicapped: false },
];

// ── Drive-in spots ──────────────────────────────────────────────────────────
export const MOCK_DRIVE_IN_SPOTS = [
  { spotId: 1, spotNumber: 'A-1', floor: 1, status: 'FREE', spotType: 'FOUR_WHEELER', pricePerHour: 40, selectable: true, isEVCharging: false, isHandicapped: false },
  { spotId: 2, spotNumber: 'A-2', floor: 1, status: 'OCCUPIED', spotType: 'FOUR_WHEELER', pricePerHour: 40, selectable: false, isEVCharging: false, isHandicapped: false },
  { spotId: 3, spotNumber: 'A-3', floor: 1, status: 'RESERVED_AVAILABLE', spotType: 'TWO_WHEELER', pricePerHour: 20, selectable: true, isEVCharging: true, isHandicapped: false, reservedFrom: '2026-05-01T14:00:00', availabilityLabel: 'Available until 2:00 PM' },
];

// ── Bookings ────────────────────────────────────────────────────────────────
export const MOCK_BOOKINGS = [
  {
    bookingId: 101,
    lotId: 1,
    spotId: 1,
    vehiclePlate: 'MH01AB1234',
    status: 'ACTIVE',
    bookingType: 'DRIVE_IN',
    startTime: '2026-04-29T09:00:00',
    endTime: '2026-04-29T12:00:00',
    checkInTime: '2026-04-29T09:05:00',
    checkOutTime: null,
    estimatedAmount: 120,
    totalAmount: 0,
    isPaid: false,
  },
  {
    bookingId: 102,
    lotId: 1,
    spotId: 3,
    vehiclePlate: 'MH01CD5678',
    status: 'RESERVED',
    bookingType: 'PRE_BOOKING',
    startTime: '2026-04-30T10:00:00',
    endTime: '2026-04-30T14:00:00',
    checkInTime: null,
    checkOutTime: null,
    estimatedAmount: 160,
    totalAmount: 0,
    isPaid: false,
  },
  {
    bookingId: 100,
    lotId: 2,
    spotId: 5,
    vehiclePlate: 'MH01AB1234',
    status: 'COMPLETED',
    bookingType: 'DRIVE_IN',
    startTime: '2026-04-28T08:00:00',
    endTime: '2026-04-28T11:00:00',
    checkInTime: '2026-04-28T08:02:00',
    checkOutTime: '2026-04-28T10:55:00',
    estimatedAmount: 120,
    totalAmount: 115,
    isPaid: false,
  },
];

// ── Vehicles ────────────────────────────────────────────────────────────────
export const MOCK_VEHICLES = [
  { vehicleId: 1, licensePlate: 'MH01AB1234', make: 'Toyota', model: 'Camry', color: 'White', vehicleType: 'FOUR_WHEELER', isEV: false },
  { vehicleId: 2, licensePlate: 'MH01CD5678', make: 'Tesla', model: 'Model 3', color: 'Black', vehicleType: 'FOUR_WHEELER', isEV: true },
];

// ── Users (admin) ───────────────────────────────────────────────────────────
export const MOCK_USERS = [
  { id: 1, fullName: 'Test Driver', email: 'driver@test.com', role: 'DRIVER', provider: 'LOCAL', active: true },
  { id: 2, fullName: 'Test Manager', email: 'manager@test.com', role: 'LOT_MANAGER', provider: 'LOCAL', active: true },
  { id: 3, fullName: 'Test Admin', email: 'admin@test.com', role: 'ADMIN', provider: 'LOCAL', active: true },
  { id: 4, fullName: 'Suspended User', email: 'suspended@test.com', role: 'DRIVER', provider: 'GOOGLE', active: false },
];

// ── Platform Analytics ──────────────────────────────────────────────────────
export const MOCK_PLATFORM_ANALYTICS = {
  totalActiveLots: 5,
  totalSpots: 250,
  totalOccupiedSpots: 120,
  totalBookingsToday: 45,
  totalBookingsAllTime: 1200,
  totalRevenueToday: 15400,
  totalRevenueAllTime: 890000,
  platformOccupancyRate: 48.0,
};

// ── Manager Dashboard ───────────────────────────────────────────────────────
export const MOCK_MANAGER_DASHBOARD = {
  totalActive: 3,
  totalUpcoming: 2,
  activeBookings: [
    {
      bookingId: 201,
      spotId: 1,
      driverEmail: 'driver@test.com',
      vehiclePlate: 'MH01AB1234',
      status: 'ACTIVE',
      bookingType: 'DRIVE_IN',
      startTime: '2026-04-29T09:00:00',
      endTime: '2026-04-29T12:00:00',
      estimatedAmount: 120,
    },
  ],
  upcomingBookings: [
    {
      bookingId: 202,
      spotId: 3,
      driverEmail: 'user2@test.com',
      vehiclePlate: 'MH02XY9999',
      status: 'RESERVED',
      bookingType: 'PRE_BOOKING',
      startTime: '2026-04-30T10:00:00',
      endTime: '2026-04-30T14:00:00',
      estimatedAmount: 200,
    },
  ],
};

// ── Notifications ───────────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Booking Confirmed', message: 'Spot A-1 at MG Road Parking', type: 'BOOKING_CONFIRMED', read: false, createdAt: '2026-04-29T09:00:00' },
  { id: 2, title: 'Check-in Reminder', message: 'Your reservation starts in 15 min', type: 'CHECKIN', read: true, createdAt: '2026-04-29T08:45:00' },
];
