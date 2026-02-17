// Client-side authentication helper using localStorage
// This replaces the server-side iron-session implementation

const AUTH_TOKEN_KEY = 'frydge-auth-token';
const USER_DATA_KEY = 'frydge-user-data';
const SESSION_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// AWS API Configuration
const AWS_BASE_URL = 'https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge';
const AUTH_TOKEN = 'ZnJ5ZGdlQDEyMzQhQCM=';

// Vendlive API Configuration
const VENDLIVE_BASE_URL = 'https://vendlive.com/api';
const FRYDGE_SALES_URL = 'https://frydge.com/testing2/vlCalls/orderSalesGET.php';

export class AuthService {
  // Check if user is logged in
  static isLoggedIn() {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const userData = localStorage.getItem(USER_DATA_KEY);

    if (!token || !userData) return false;

    // Check if session has expired
    try {
      const user = JSON.parse(userData);
      const now = Date.now();
      const sessionTime = user.sessionTime || 0;

      if (now - sessionTime > SESSION_TIMEOUT) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.logout();
      return false;
    }
  }

  // Get current auth token
  static getAuthToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  // Get current user data
  static getUserData() {
    if (typeof window === 'undefined') return null;

    try {
      const userData = localStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Login user and store session data
  static async login(email, password) {
    try {
      const response = await fetch(`${AWS_BASE_URL}/dashboard_users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': AUTH_TOKEN,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.status === 200 && data.key) {
        // Store auth token and user data
        localStorage.setItem(AUTH_TOKEN_KEY, data.key);

        const userData = {
          ...data.user,
          sessionTime: Date.now(),
        };
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

        return {
          success: true,
          message: 'Login successful',
          authToken: data.key,
          user: data.user,
        };
      } else if (response.status === 400 && data.nonFieldErrors) {
        return {
          success: false,
          error: 'Wrong username or password!',
        };
      } else {
        return {
          success: false,
          error: `API authentication failed: ${response.status}`,
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Internal server error',
      };
    }
  }

  // Logout user and clear session data
  static logout() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
  }

  // Check session status (for compatibility with existing code)
  static async checkSession() {
    return {
      isLoggedIn: this.isLoggedIn(),
      authToken: this.getAuthToken(),
    };
  }
}

// API Helper functions for direct AWS/Vendlive calls
export class ApiService {
  // Make authenticated request to AWS API
  static async awsRequest(endpoint, options = {}) {
    const authToken = AuthService.getAuthToken();

    if (!authToken) {
      throw new Error('No authentication token available');
    }

    const url = `${AWS_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': AUTH_TOKEN,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      AuthService.logout();
      throw new Error('Authentication failed');
    }

    return response;
  }

  // Make authenticated request to Vendlive API
  static async vendliveRequest(endpoint, options = {}) {
    const authToken = AuthService.getAuthToken();

    if (!authToken) {
      throw new Error('No authentication token available');
    }

    const url = `${VENDLIVE_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Token ${authToken}`,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (response.status === 401 || response.status === 403) {
      AuthService.logout();
      throw new Error('Authentication failed');
    }

    return response;
  }

  // Make request to Frydge sales API
  static async frydgeSalesRequest(params) {
    const url = `${FRYDGE_SALES_URL}?${new URLSearchParams(params).toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  }
}

// Export individual API functions for easy use
export const api = {
  // Orders
  getOrders: async (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add all parameters except null values
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== 'null') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    const response = await ApiService.awsRequest(`/orders?${queryString}`);

    if (response.ok) {
      const data = await response.json();

      // Transform the response to match frontend expectations
      const transformedResponse = {
        orders: data.orderData || [],
        lastKey: data.lastKey || null,
        hasMore: !!data.lastKey,
        message: data.message || "Orders retrieved",
        total: data.total || data.orderData?.length || 0,
      };

      return {
        ok: true,
        json: () => Promise.resolve(transformedResponse),
        status: response.status,
      };
    }

    return response;
  },

  // Driver Routes
  getDriverRoutes: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add all parameters except null values
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== 'null') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return ApiService.awsRequest(`/driver_routes?${queryString}`);
  },

  createDriverRoute: (data) => {
    return ApiService.awsRequest('/driver_routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateDriverRoute: (data) => {
    return ApiService.awsRequest('/driver_routes', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Cleaner Routes
  getCleanerRoutes: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add all parameters except null values
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== 'null') {
        queryParams.append(key, value);
      }
    });

    const queryString = queryParams.toString();
    return ApiService.awsRequest(`/cleaner_routes?${queryString}`);
  },

  createCleanerRoute: (data) => {
    return ApiService.awsRequest('/cleaner_routes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCleanerRoute: (data) => {
    return ApiService.awsRequest('/cleaner_routes', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Venue Groups
  getVenueGroups: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiService.awsRequest(`/venue_group?${queryString}`);
  },

  // Users (Dashboard Users)
  getUsers: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (params.limit) {
      queryParams.append('limit', params.limit);
    }

    // Add lastKey only if it's not null or undefined
    if (params.lastKey && params.lastKey !== 'null' && params.lastKey !== null) {
      queryParams.append('lastKey', params.lastKey);
    }

    // Add userId if provided
    if (params.userId) {
      queryParams.append('userId', params.userId);
    }

    const queryString = queryParams.toString();
    return ApiService.awsRequest(`/dashboard_users?${queryString}`);
  },

  createUser: (data) => {
    return ApiService.awsRequest('/dashboard_users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: (data) => {
    return ApiService.awsRequest('/dashboard_users', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteUser: (data) => {
    return ApiService.awsRequest('/dashboard_users', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  // Machines (Vendlive)
  getMachines: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiService.vendliveRequest(`/2.0/machines/?${queryString}`);
  },

  getMachineLocations: () => {
    return ApiService.vendliveRequest('/1.0/get-machine-locations/?format=json');
  },

  // Machine Sales (Frydge)
  getMachineSales: (params) => {
    return ApiService.frydgeSalesRequest(params);
  },

  // Orders Count
  getOrdersCount: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiService.awsRequest(`/orders/count?${queryString}`);
  },

  // Vacant Locations
  getVacantLocations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/driver_routes/vacant_locations?${queryString}`;

    console.log('Fetching vacant locations from:', url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "ZnJ5ZGdlQDEyMzQhQCM=",
        },
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Vacant Locations API Error:", errorText);
        return {
          ok: false,
          status: response.status,
          json: () => Promise.resolve({ error: `API error: ${response.status}` }),
        };
      }

      const data = await response.json();
      return {
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
      };
    } catch (error) {
      console.error("Vacant Locations API Route Error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      return {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: `Server error: ${error.message}` }),
      };
    }
  },



  // Venue Group by ID - Direct call with CORS handling
  getVenueGroupById: async (id) => {
    const url = `https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/venue_group?groupId=${id}`;

    console.log('Venue Group by ID - Group ID:', id);
    console.log('Venue Group by ID - URL:', url);
    console.log('Venue Group by ID - Authorization header:', 'ZnJ5ZGdlQDEyMzQhQCM=');

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'ZnJ5ZGdlQDEyMzQhQCM=',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('Venue Group by ID - Response status:', response.status);
      console.log('Venue Group by ID - Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Venue Group by ID - API Error:', errorText);
      }

      return response;
    } catch (error) {
      console.error('Venue Group by ID Error:', error);

      // If CORS error, return helpful message
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Venue Group by ID - CORS Error detected');
        return {
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            error: "CORS Error: Unable to fetch venue group details. The AWS API Gateway needs CORS configuration to allow browser requests.",
            corsError: true,
            suggestion: "This is a CORS issue. The AWS API Gateway needs to be configured to allow browser requests. Contact your backend team to enable CORS for this endpoint.",
            originalError: error.message
          }),
        };
      }

      return {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: `Server error: ${error.message}` }),
      };
    }
  },

  // Create Venue Group
  createVenueGroup: (data) => {
    return ApiService.awsRequest('/venue_group', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update Venue Group
  updateVenueGroup: (data) => {
    return ApiService.awsRequest('/venue_group', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete Venue Group
  deleteVenueGroup: (data) => {
    return ApiService.awsRequest('/venue_group', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  // Delete Driver Route
  deleteDriverRoute: (data) => {
    return ApiService.awsRequest('/driver_routes', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  // Update Cleaner Route
  updateCleanerRoute: (data) => {
    return ApiService.awsRequest('/cleaner_routes', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete Cleaner Route
  deleteCleanerRoute: (data) => {
    return ApiService.awsRequest('/cleaner_routes', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  // Get Drivers
  getDrivers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiService.awsRequest(`/dashboard_users/drivers?${queryString}`);
  },

  // Cleaner Vacant Locations
  getCleanerVacantLocations: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return ApiService.awsRequest(`/cleaner_routes/vacant_locations?${queryString}`);
  },

  // Machine Sales (Frydge) - Direct call to Frydge API
  getMachineSales: (params) => {
    const { machineId, startDate, endDate } = params;
    const url = `https://frydge.com/testing2/vlCalls/orderSalesGET.php?machineId=${machineId}&startDate=${startDate}&endDate=${endDate}`;

    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Machine Venue (Frydge) - Direct call to Frydge API
  getMachineVenue: (params = {}) => {
    const { machineId } = params;
    const url = `https://frydge.com/testing2/vlCalls/venueMachineIdGET.php?machineId=${machineId}`;

    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Device Status (Vendlive) - Direct call to Vendlive API
  getDeviceStatus: async (params = {}) => {
    const { deviceId, machineId } = params;
    const token = AuthService.getAuthToken();

    if (!token) {
      return {
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "No authentication token available" }),
      };
    }

    if (!deviceId || !machineId) {
      return {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "deviceId and machineId are required" }),
      };
    }

    const url = `https://vendlive.com/api/2.0/devices/${deviceId}/?machineId=${machineId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'accept': 'application/json',
        },
      });

      return response;
    } catch (error) {
      console.error('Device Status Error:', error);
      return {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: `Server error: ${error.message}` }),
      };
    }
  },

  // Device Toggle (Vendlive) - Direct call to Vendlive API
  toggleDevice: async (data) => {
    const { deviceId, machineId, enabled } = data;
    const token = AuthService.getAuthToken();

    console.log('Device Toggle - Device ID:', deviceId);
    console.log('Device Toggle - Machine ID:', machineId);
    console.log('Device Toggle - Enabled:', enabled);
    console.log('Device Toggle - Token available:', !!token);
    console.log('Device Toggle - Token length:', token ? token.length : 0);

    if (!token) {
      console.error('Device Toggle - No authentication token available');
      return {
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "No authentication token available" }),
      };
    }

    if (!deviceId || !machineId || enabled === undefined) {
      console.error('Device Toggle - Missing required fields');
      return {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "deviceId, machineId, and enabled are required" }),
      };
    }

    const url = `https://vendlive.com/api/2.0/devices/${deviceId}/?machineId=${machineId}`;
    const requestBody = { enabled };

    console.log('Device Toggle - URL:', url);
    console.log('Device Toggle - Request body:', requestBody);
    console.log('Device Toggle - Authorization header:', `Token ${token}`);

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
          'accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Device Toggle - Response status:', response.status);
      console.log('Device Toggle - Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Device Toggle - API Error:', errorText);
      }

      return response;
    } catch (error) {
      console.error('Device Toggle Error:', error);
      return {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: `Server error: ${error.message}` }),
      };
    }
  },

  // Enable Machine (AWS) - Direct call with CORS handling
  enableMachine: async (data) => {
    const { machineId, enabled, removeOrders } = data;

    console.log('Enable Machine - Machine ID:', machineId);
    console.log('Enable Machine - Enabled:', enabled);
    console.log('Enable Machine - Remove Orders:', removeOrders);

    if (!machineId || enabled === undefined || removeOrders === undefined) {
      console.error('Enable Machine - Missing required fields');
      return {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Missing required fields" }),
      };
    }

    const url = 'https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/machine_internal/enable';
    const requestBody = {
      machineId,
      enabled,
      removeOrders
    };

    console.log('Enable Machine - URL:', url);
    console.log('Enable Machine - Request body:', requestBody);
    console.log('Enable Machine - Authorization header:', 'ZnJ5ZGdlQDEyMzQhQCM=');

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'ZnJ5ZGdlQDEyMzQhQCM=',
        },
        body: JSON.stringify(requestBody),
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('Enable Machine - Response status:', response.status);
      console.log('Enable Machine - Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Enable Machine - API Error:', errorText);
      }

      return response;
    } catch (error) {
      console.error('Enable Machine Error:', error);

      // If CORS error, return helpful message
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('Enable Machine - CORS Error detected');
        return {
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            error: "CORS Error: Unable to enable/disable machine. The AWS API Gateway needs CORS configuration to allow browser requests.",
            corsError: true,
            suggestion: "This is a CORS issue. The AWS API Gateway needs to be configured to allow browser requests. Contact your backend team to enable CORS for this endpoint.",
            originalError: error.message
          }),
        };
      }

      return {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: `Server error: ${error.message}` }),
      };
    }
  },

  // Sync Machine (Vendlive) - Direct call to Vendlive API
  syncMachine: async (data) => {
    const { machineId } = data;
    const token = AuthService.getAuthToken();

    console.log('Sync Machine - Machine ID:', machineId);
    console.log('Sync Machine - Token available:', !!token);
    console.log('Sync Machine - Token length:', token ? token.length : 0);

    if (!token) {
      console.error('Sync Machine - No authentication token available');
      return {
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "No authentication token available" }),
      };
    }

    if (!machineId) {
      console.error('Sync Machine - Machine ID is required');
      return {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Machine ID is required" }),
      };
    }

    const url = `https://vendlive.com/api/1.0/machine/${machineId}/sync-channels-to-machine/`;

    console.log('Sync Machine - URL:', url);
    console.log('Sync Machine - Authorization header:', `Token ${token}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      console.log('Sync Machine - Response status:', response.status);
      console.log('Sync Machine - Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Sync Machine - API Error:', errorText);
      }

      return response;
    } catch (error) {
      console.error('Sync Machine Error:', error);
      return {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: `Server error: ${error.message}` }),
      };
    }
  },

  // Get Encrypted Machine ID (AWS) - Direct call with CORS handling
  getEncryptedMachineId: async (params = {}) => {
    const { machineId } = params;

    if (!machineId) {
      return {
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Missing machineId" }),
      };
    }

    const url = `https://tngndxywc1.execute-api.eu-central-1.amazonaws.com/Dev/frydge/machine_internal/qrlink/${machineId}`;

    console.log('Fetching encrypted machine ID from:', url);

    try {
      // Try direct fetch first
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Success, data:', data);
        return {
          ok: true,
          status: 200,
          json: () => Promise.resolve(data)
        };
      } else {
        const errorText = await response.text();
        console.error('AWS API Error:', errorText);
        return {
          ok: false,
          status: response.status,
          json: () => Promise.resolve({ error: `AWS API error: ${response.status} - ${errorText}` }),
        };
      }
    } catch (error) {
      console.error('Get Encrypted Machine ID Error:', error);

      // If CORS error, return helpful message
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return {
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            error: "CORS Error: Unable to fetch encrypted machine ID. The AWS API Gateway needs CORS configuration to allow browser requests.",
            corsError: true,
            suggestion: "This is a CORS issue. The AWS API Gateway needs to be configured to allow browser requests. Contact your backend team to enable CORS for this endpoint.",
            originalError: error.message
          }),
        };
      }

      return {
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: `Server error: ${error.message}` }),
      };
    }
  },

  getProducts: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (params.limit) {
      queryParams.append('limit', params.limit);
    }

    // Add lastKey only if it's not null or undefined
    if (params.lastKey && params.lastKey !== 'null' && params.lastKey !== null) {
      queryParams.append('lastKey', params.lastKey);
    }

    // Add productId if provided
    if (params.productId) {
      queryParams.append('productId', params.productId);
    }

    // Add supplierId if provided
    if (params.supplierId) {
      queryParams.append('supplierId', params.supplierId);
    }

    const queryString = queryParams.toString();
    return ApiService.awsRequest(`/products?${queryString}`);
  },

  getProductsByCategoryAndSupplier: (supplierIds, categoryIds) => {

    return ApiService.awsRequest(`/products?supplierId=${supplierIds}&productCategoryId=${categoryIds}`);
  },

  syncProducts: () => {
    return ApiService.awsRequest(`/products/sync`, {
      method: 'POST',
    });
  },
  updateProduct: (payload) => {
    return ApiService.awsRequest(`/products`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // get Suppliers

  getSuppliers: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (params.limit) {
      queryParams.append('limit', params.limit);
    }

    // Add lastKey
    if (params.lastKey !== undefined && params.lastKey !== null && params.lastKey !== "null") {
      queryParams.append('lastKey', params.lastKey);
    }

    // Add supplierId filter (optional)
    if (params.supplierId) {
      queryParams.append('supplierId', params.supplierId);
    }

    const queryString = queryParams.toString();
    return ApiService.awsRequest(`/suppliers?${queryString}`);
  },

  // Create Suppliers
  createSuppliers: (data) => {
    return ApiService.awsRequest('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },


  updateSuppliers: (data) => {
    return ApiService.awsRequest('/suppliers', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },


  deleteSupplier: (data) => {
    return ApiService.awsRequest('/suppliers', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },


  getProductsCategories: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (params?.limit) {
      queryParams.append('limit', params.limit);
    }

    // Add lastKey
    if (params?.lastKey !== undefined && params.lastKey !== null && params.lastKey !== "null") {
      queryParams.append('lastKey', params.lastKey);
    }


    const queryString = queryParams.toString();
    return ApiService.awsRequest(`/product_categories?${queryString}`);
  },

  // Create Category
  createProductCategory: (data) => {
    return ApiService.awsRequest('/product_categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },


  deleteProductCategory: (data) => {
    return ApiService.awsRequest('/product_categories', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  },

  updateProductCategory: (data) => {
    return ApiService.awsRequest('/product_categories', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Get Ploanogram Versions
  getPlanogramVersions: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    // Add lastKey only if it's valid
    if (params.lastKey && params.lastKey !== "null" && params.lastKey !== null) {
      queryParams.append("lastKey", params.lastKey);
    }

    // ✅ Add planogramVersionId only if provided
    if (
      params.planogramVersionId &&
      params.planogramVersionId !== "null" &&
      params.planogramVersionId !== null
    ) {
      queryParams.append("planogramVersionId", params.planogramVersionId);
    }

    const queryString = queryParams.toString();

    return ApiService.awsRequest(
      `/planogram_versions${queryString ? `?${queryString}` : ""}`
    );
  },

  // Create Planogram Version
  createPlanogramVersion: (data) => {
    return ApiService.awsRequest('/planogram_versions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update Planogram Version 
  updatePlangoramVersion: (payload) => {
    console.log(payload);
    return ApiService.awsRequest(`/planogram_versions`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Init Planogram Structure
  initPlanogramStructure: (planogramId, data) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (data.force === true) {
      queryParams.append("force", data.force);
    }
    const queryString = queryParams.toString();
    return ApiService.awsRequest(`/planogram_versions/${planogramId}/structure:init${queryString ? `?${queryString}` : ""}`, {
      method: 'POST',
      // body: JSON.stringify(data),
    });
  },


  getPlanogramStructure: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add machineId
    if (params.machineStructureId && params.machineStructureId !== "null") {
      queryParams.append("machineStructureId", params.machineStructureId);
    }

    // Add planogramVersionId
    if (params.planogramVersionId && params.planogramVersionId !== "null") {
      queryParams.append("planogramVersionId", params.planogramVersionId);
    }

    // ✅ Add machineId
    if (params.machineId && params.machineId !== "null") {
      queryParams.append("machineId", params.machineId);
    }

    const queryString = queryParams.toString();

    return ApiService.awsRequest(
      `/planogram_versions/structure${queryString ? `?${queryString}` : ""}`
    );
  },



  // Update Planogram Version 
  updatePlangoramVersionStructure: (planogramId, payload) => {

    return ApiService.awsRequest(`/planogram_versions/${planogramId}/structure`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deletePlangoramVersion: (payload) => {
    return ApiService.awsRequest(`/planogram_versions`, {
      method: 'DELETE',
      body: JSON.stringify(payload),
    });
  },


  finalizePlangoramVersionStructure: (planogramId, payload) => {
    return ApiService.awsRequest(`/planogram_versions/${planogramId}/structure:finalize`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },


  SyncwithVendlive: (planogramVersionId) => {
    return ApiService.awsRequest(`/planogram_versions/${planogramVersionId}/sync`, {
      method: 'PATCH',
    });
  },

  // Get Internal Orders Dates
  getInternalOrederDates: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    // Add lastKey only if it's valid
    if (params.lastKey && params.lastKey !== "null" && params.lastKey !== null) {
      queryParams.append("lastKey", params.lastKey);
    }

    // ✅ Add planogramVersionId only if provided
    if (
      params.planogramVersionId &&
      params.planogramVersionId !== "null" &&
      params.planogramVersionId !== null
    ) {
      queryParams.append("planogramVersionId", params.planogramVersionId);
    }
    // ✅ Add machineId only if provided
    if (
      params.machineId &&
      params.machineId !== "null" &&
      params.machineId !== null
    ) {
      queryParams.append("machineId", params.machineId);
    }

    const queryString = queryParams.toString();

    return ApiService.awsRequest(
      `/planogram_orders/dates${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get Internal Orders
  getInternalOreders: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    // Add lastKey only if it's valid
    if (params.lastKey && params.lastKey !== "null" && params.lastKey !== null) {
      queryParams.append("lastKey", params.lastKey);
    }

    // ✅ Add planogramVersionId only if provided
    if (
      params.planogramVersionId &&
      params.planogramVersionId !== "null" &&
      params.planogramVersionId !== null
    ) {
      queryParams.append("planogramVersionId", params.planogramVersionId);
    }
    // ✅ Add machineId only if provided
    if (
      params.machineId &&
      params.machineId !== "null" &&
      params.machineId !== null
    ) {
      queryParams.append("machineId", params.machineId);
    }
    if (
      params.planogramOrderId &&
      params.planogramOrderId !== "null" &&
      params.planogramOrderId !== null
    ) {
      queryParams.append("planogramOrderId", params.planogramOrderId);
    }

    const queryString = queryParams.toString();

    return ApiService.awsRequest(
      `/planogram_orders${queryString ? `?${queryString}` : ""}`
    );
  },

  getOrderSnapshotChannels: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    // Add lastKey only if it's valid
    if (params.lastKey && params.lastKey !== "null" && params.lastKey !== null) {
      queryParams.append("lastKey", params.lastKey);
    }

    // ✅ Add planogramVersionId only if provided
    if (
      params.orderSnapshotId &&
      params.orderSnapshotId !== "null" &&
      params.orderSnapshotId !== null
    ) {
      queryParams.append("orderSnapshotId", params.orderSnapshotId);
    }
    // ✅ Add machineId only if provided
    if (
      params.machineId &&
      params.machineId !== "null" &&
      params.machineId !== null
    ) {
      queryParams.append("machineId", params.machineId);
    }

    // ✅ Add plannedPlanogramDate only if provided
    if (
      params.plannedPlanogramDate &&
      params.plannedPlanogramDate !== "null" &&
      params.plannedPlanogramDate !== null
    ) {
      queryParams.append("plannedPlanogramDate", params.plannedPlanogramDate);
    }

    // ✅ Add planogramVersionId only if provided
    if (
      params.planogramVersionId &&
      params.planogramVersionId !== "null" &&
      params.planogramVersionId !== null
    ) {
      queryParams.append("planogramVersionId", params.planogramVersionId);
    }

    const queryString = queryParams.toString();

    return ApiService.awsRequest(
      `/order_snapshots${queryString ? `?${queryString}` : ""}`
    );
  },

  planogramVersionDetails: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit if provided
    if (params.limit) {
      queryParams.append("limit", params.limit);
    }

    // Add versionDetailId if provided
    if (
      params.versionDetailId &&
      params.versionDetailId !== "null" &&
      params.versionDetailId !== null
    ) {
      queryParams.append("versionDetailId", params.versionDetailId);
    }

    const queryString = queryParams.toString();

    return ApiService.awsRequest(
      `/planogram_version_details${queryString ? `?${queryString}` : ""}`
    );
  },


  // Get Internal Orders
  getOrderSupplierFileName: (params = {}) => {
    const queryParams = new URLSearchParams();

    // Add limit
    if (params.filename) {
      queryParams.append("filename", params.filename);
    }

    const queryString = queryParams.toString();

    return ApiService.awsRequest(
      `/planogram_orders/file${queryString ? `?${queryString}` : ""}`
    );
  },

};
