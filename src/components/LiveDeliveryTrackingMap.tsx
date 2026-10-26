import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import {
  Truck,
  MapPin,
  Navigation,
  CheckCircle2,
  Clock,
  QrCode,
  Play,
  Pause,
  ShieldCheck,
  AlertCircle,
  Phone,
  LocateFixed,
  PackageCheck,
} from 'lucide-react';
import { Order, DeliveryAgentProfile } from '../types';
import { platformStore } from '../services/store';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

interface PickupHubInfo {
  hubName: string;
  address: string;
  coords: LatLngLiteral;
}

/**
 * Resolve realistic Nigerian coordinates for Pickup Hub / Merchant Warehouse
 */
function resolvePickupHub(order: Order): PickupHubInfo {
  if (order.pickupLocation) {
    return {
      hubName: order.pickupLocation.hubName,
      address: order.pickupLocation.address,
      coords: { lat: order.pickupLocation.lat, lng: order.pickupLocation.lng },
    };
  }

  const firstItem = order.items?.[0];
  const merchants = platformStore.getState().merchants || [];
  const merchant = merchants.find((m) => m.id === firstItem?.merchantId);

  if (merchant && firstItem?.fulfillmentType === 'merchant_held' && merchant.warehouseAddress) {
    const addr = merchant.warehouseAddress.toLowerCase();
    if (addr.includes('ladipo') || addr.includes('mushin')) {
      return {
        hubName: `${merchant.businessName} Warehouse`,
        address: merchant.warehouseAddress,
        coords: { lat: 6.5355, lng: 3.349 },
      };
    }
    if (addr.includes('ikota') || addr.includes('vgc') || addr.includes('lekki')) {
      return {
        hubName: `${merchant.businessName} Depot`,
        address: merchant.warehouseAddress,
        coords: { lat: 6.4395, lng: 3.5535 },
      };
    }
    if (addr.includes('alaba') || addr.includes('ojo')) {
      return {
        hubName: `${merchant.businessName} Warehouse`,
        address: merchant.warehouseAddress,
        coords: { lat: 6.4612, lng: 3.1908 },
      };
    }
  }

  // Default to Ikeja Central Fulfillment Hub (or Ikorodu Rd Agro Hub for mrc-1)
  if (firstItem?.merchantId === 'mrc-1') {
    return {
      hubName: 'Ikorodu Road Agro Fulfillment Depot',
      address: 'Agro Industrial Estate, Plot 12, Ikorodu Road, Lagos',
      coords: { lat: 6.5852, lng: 3.3685 },
    };
  }

  return {
    hubName: 'Ikeja Central Fulfillment Hub',
    address: 'Plot 14, Simbiat Abiola Rd, Ikeja, Lagos',
    coords: { lat: 6.5965, lng: 3.3421 },
  };
}

/**
 * Resolve realistic coordinates for customer delivery addresses across Lagos / Nigeria
 */
function resolveDeliveryCoords(order: Order): LatLngLiteral {
  if (order.deliveryCoordinates) {
    return order.deliveryCoordinates;
  }
  const addr = (order.deliveryAddress || '').toLowerCase();
  if (addr.includes('admiralty') || addr.includes('lekki phase 1') || addr.includes('lekki')) {
    return { lat: 6.4478, lng: 3.4723 };
  }
  if (addr.includes('adeola odeku') || addr.includes('victoria island') || addr.includes('vi')) {
    return { lat: 6.4291, lng: 3.4158 };
  }
  if (addr.includes('isaac john') || addr.includes('gra ikeja') || addr.includes('ikeja')) {
    return { lat: 6.5818, lng: 3.3569 };
  }
  if (addr.includes('ikoyi') || addr.includes('bourdillon')) {
    return { lat: 6.4549, lng: 3.4346 };
  }
  if (addr.includes('yaba') || addr.includes('herbert macaulay')) {
    return { lat: 6.5095, lng: 3.3711 };
  }
  if (addr.includes('surulere') || addr.includes('bode thomas')) {
    return { lat: 6.4926, lng: 3.349 };
  }
  if (addr.includes('abuja') || addr.includes('wuse') || addr.includes('maitama')) {
    return { lat: 9.0765, lng: 7.476 };
  }
  // Deterministic offset in Lagos Metro so every order has a distinct pin
  const hash = (order.id || 'ord').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return {
    lat: 6.455 + ((hash % 80) * 0.0012),
    lng: 3.405 + (((hash * 7) % 80) * 0.0012),
  };
}

/**
 * Interpolate a coordinate along a polyline path given progress (0..100)
 */
function interpolateAlongPath(
  path: LatLngLiteral[],
  fallbackStart: LatLngLiteral,
  fallbackEnd: LatLngLiteral,
  progressPct: number
): LatLngLiteral {
  const clamped = Math.max(0, Math.min(100, progressPct)) / 100;
  if (!path || path.length < 2) {
    return {
      lat: fallbackStart.lat + (fallbackEnd.lat - fallbackStart.lat) * clamped,
      lng: fallbackStart.lng + (fallbackEnd.lng - fallbackStart.lng) * clamped,
    };
  }

  const exactIdx = clamped * (path.length - 1);
  const lowerIdx = Math.floor(exactIdx);
  const upperIdx = Math.min(path.length - 1, lowerIdx + 1);
  const fraction = exactIdx - lowerIdx;
  const p1 = path[lowerIdx];
  const p2 = path[upperIdx];

  return {
    lat: p1.lat + (p2.lat - p1.lat) * fraction,
    lng: p1.lng + (p2.lng - p1.lng) * fraction,
  };
}

interface RouteCanvasLayerProps {
  origin: LatLngLiteral;
  destination: LatLngLiteral;
  strokeColor: string;
  onRouteComputed: (data: {
    distanceMeters: number;
    durationMillis: number;
    path: LatLngLiteral[];
  }) => void;
}

/**
 * Uses the modern Google Maps Routes API (`useMapsLibrary('routes')` + `Route.computeRoutes`)
 * to calculate the road path, render polylines, and fit the viewport.
 */
const RouteCanvasLayer: React.FC<RouteCanvasLayerProps> = ({
  origin,
  destination,
  strokeColor,
  onRouteComputed,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    // Clean up existing polylines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    let isCancelled = false;

    const request = {
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    const routeClass = (routesLib as any).Route;
    if (!routeClass || typeof routeClass.computeRoutes !== 'function') {
      return;
    }

    routeClass
      .computeRoutes(request)
      .then(({ routes }: { routes: any[] }) => {
        if (isCancelled || !routes || routes.length === 0) return;

        const primaryRoute = routes[0];

        if (typeof primaryRoute.createPolylines === 'function') {
          const newPolylines: google.maps.Polyline[] = primaryRoute.createPolylines();
          newPolylines.forEach((polyline) => {
            polyline.setOptions({
              strokeColor,
              strokeWeight: 5,
              strokeOpacity: 0.9,
            });
            polyline.setMap(map);
          });
          polylinesRef.current = newPolylines;
        }

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 48);
        }

        const extractedPath: LatLngLiteral[] = Array.isArray(primaryRoute.path)
          ? primaryRoute.path.map((pt: any) => ({
              lat: typeof pt.lat === 'function' ? pt.lat() : Number(pt.lat),
              lng: typeof pt.lng === 'function' ? pt.lng() : Number(pt.lng),
            }))
          : [origin, destination];

        onRouteComputed({
          distanceMeters: primaryRoute.distanceMeters ?? 8500,
          durationMillis: primaryRoute.durationMillis ?? 1320000,
          path: extractedPath,
        });
      })
      .catch(() => {
        // Fallback straight-line metrics if Routes API is not enabled on user's GCP project yet
        if (isCancelled) return;
        const dLat = destination.lat - origin.lat;
        const dLng = destination.lng - origin.lng;
        const approxMeters = Math.max(
          1500,
          Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 111320 * 1.25)
        );
        const approxDurationMs = Math.round((approxMeters / 1000) * 2.4 * 60 * 1000);
        onRouteComputed({
          distanceMeters: approxMeters,
          durationMillis: approxDurationMs,
          path: [origin, destination],
        });
      });

    return () => {
      isCancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng, strokeColor, onRouteComputed]);

  return null;
};

interface MapMarkersLayerProps {
  pickupHub: PickupHubInfo;
  deliveryCoords: LatLngLiteral;
  deliveryAddress: string;
  customerName: string;
  agentCoords: LatLngLiteral;
  agentName: string;
  agentVehicle: string;
  isPickedUp: boolean;
  isDelivered: boolean;
  progressPct: number;
  accentColor?: string;
}

const MapMarkersLayer: React.FC<MapMarkersLayerProps> = ({
  pickupHub,
  deliveryCoords,
  deliveryAddress,
  customerName,
  agentCoords,
  agentName,
  agentVehicle,
  isPickedUp,
  isDelivered,
  progressPct,
  accentColor,
}) => {
  const [pickupMarkerRef, pickupMarker] = useAdvancedMarkerRef();
  const [deliveryMarkerRef, deliveryMarker] = useAdvancedMarkerRef();
  const [agentMarkerRef, agentMarker] = useAdvancedMarkerRef();

  const [openInfoWindow, setOpenInfoWindow] = useState<'pickup' | 'delivery' | 'agent' | null>(
    'agent'
  );

  const primaryBadgeColor = accentColor || '#00A862';

  return (
    <>
      {/* 1. PICKUP HUB / WAREHOUSE MARKER */}
      <AdvancedMarker
        ref={pickupMarkerRef}
        position={pickupHub.coords}
        onClick={() => setOpenInfoWindow('pickup')}
        title={`Pickup Location: ${pickupHub.hubName}`}
      >
        <div className="bg-dark text-white px-2.5 py-1.5 rounded border border-white/80 flex items-center gap-1.5 text-[11px] font-bold">
          <PackageCheck className="w-3.5 h-3.5 text-primary shrink-0" strokeWidth={2} />
          <span>PICKUP HUB</span>
        </div>
      </AdvancedMarker>

      {openInfoWindow === 'pickup' && pickupMarker && (
        <InfoWindow anchor={pickupMarker} onCloseClick={() => setOpenInfoWindow(null)}>
          <div className="p-1 text-ink text-[12px] max-w-[210px] space-y-1">
            <div className="font-bold text-ink">{pickupHub.hubName}</div>
            <div className="text-muted text-[11px]">{pickupHub.address}</div>
            <div className="text-[11px] font-bold" style={{ color: primaryBadgeColor }}>
              {isPickedUp ? '✓ Package Picked Up by Courier' : 'Awaiting Courier Pickup'}
            </div>
          </div>
        </InfoWindow>
      )}

      {/* 2. CUSTOMER DELIVERY DESTINATION MARKER */}
      <AdvancedMarker
        ref={deliveryMarkerRef}
        position={deliveryCoords}
        onClick={() => setOpenInfoWindow('delivery')}
        title={`Delivery Location: ${deliveryAddress}`}
      >
        <div
          className="text-white px-2.5 py-1.5 rounded border border-white flex items-center gap-1.5 text-[11px] font-bold"
          style={{ backgroundColor: isDelivered ? primaryBadgeColor : '#E5352B' }}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          <span>{isDelivered ? 'DELIVERED' : 'DROP-OFF'}</span>
        </div>
      </AdvancedMarker>

      {openInfoWindow === 'delivery' && deliveryMarker && (
        <InfoWindow anchor={deliveryMarker} onCloseClick={() => setOpenInfoWindow(null)}>
          <div className="p-1 text-ink text-[12px] max-w-[210px] space-y-1">
            <div className="font-bold text-ink">Buyer: {customerName}</div>
            <div className="text-muted text-[11px]">{deliveryAddress}</div>
            <div className="text-[11px] font-bold text-ink">
              {isDelivered ? '✓ Handover QR Verified' : 'Escrow QR Handover Point'}
            </div>
          </div>
        </InfoWindow>
      )}

      {/* 3. DELIVERY AGENT LIVE VEHICLE MARKER */}
      {!isDelivered && (
        <>
          <AdvancedMarker
            ref={agentMarkerRef}
            position={agentCoords}
            onClick={() => setOpenInfoWindow('agent')}
            title={`Courier: ${agentName} (${agentVehicle})`}
          >
            <div
              className="px-2.5 py-1.5 rounded border-2 border-dark flex items-center gap-1.5 text-[11px] font-bold"
              style={
                accentColor
                  ? { backgroundColor: accentColor, color: '#FFFFFF', borderColor: '#FFFFFF' }
                  : { backgroundColor: '#00D27A', color: '#0B1F17' }
              }
            >
              <Truck className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>
                {agentName.split(' ')[0]} • {isPickedUp ? `${progressPct}%` : 'To Hub'}
              </span>
            </div>
          </AdvancedMarker>

          {openInfoWindow === 'agent' && agentMarker && (
            <InfoWindow anchor={agentMarker} onCloseClick={() => setOpenInfoWindow(null)}>
              <div className="p-1 text-ink text-[12px] max-w-[210px] space-y-1">
                <div className="font-bold text-ink">{agentName}</div>
                <div className="text-muted text-[11px]">{agentVehicle}</div>
                <div className="text-[11px] font-bold" style={{ color: primaryBadgeColor }}>
                  {isPickedUp
                    ? `En-route to Buyer (${progressPct}% complete)`
                    : 'Heading to Pickup Hub'}
                </div>
              </div>
            </InfoWindow>
          )}
        </>
      )}
    </>
  );
};

interface MapLoadGuardProps {
  children: React.ReactNode;
}

const MapLoadGuard: React.FC<MapLoadGuardProps> = ({ children }) => {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.AUTH_FAILURE || status === APILoadingStatus.FAILED) {
    return (
      <div className="w-full h-[360px] bg-page border border-line rounded flex flex-col items-center justify-center p-6 text-center space-y-2">
        <AlertCircle className="w-6 h-6 text-sale" strokeWidth={1.75} />
        <div className="text-[14px] font-bold text-ink">
          Unable to initialize Google Maps JavaScript SDK
        </div>
        <p className="text-[12px] text-muted max-w-md">
          Please verify that your Google Maps API key is valid and has the Maps JavaScript API and Routes API enabled in Google Cloud Console.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export interface LiveDeliveryTrackingMapProps {
  mode: 'agent' | 'customer';
  order: Order;
  agent?: DeliveryAgentProfile;
  /** Optional custom accent color when embedded in a white-label IBO storefront */
  accentColor?: string;
  onOpenQrModal?: (order: Order) => void;
  onScanPickupQr?: () => void;
}

export const LiveDeliveryTrackingMap: React.FC<LiveDeliveryTrackingMapProps> = ({
  mode,
  order,
  agent,
  accentColor,
  onOpenQrModal,
  onScanPickupQr,
}) => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

  const pickupHub = useMemo(() => resolvePickupHub(order), [order]);
  const deliveryCoords = useMemo(() => resolveDeliveryCoords(order), [order]);

  const isPickedUp = Boolean(
    order.isPickupConfirmed ||
      order.orderStatus === 'in_transit' ||
      order.orderStatus === 'arrived_at_customer' ||
      order.orderStatus === 'delivered'
  );
  const isDelivered = order.orderStatus === 'delivered';

  // Route metrics & road path points returned by Route.computeRoutes
  const [routeMetrics, setRouteMetrics] = useState<{
    distanceMeters: number;
    durationMillis: number;
    path: LatLngLiteral[];
  }>({
    distanceMeters: 9400,
    durationMillis: 1440000, // 24 mins
    path: [],
  });

  // Live progress percentage (0% at Pickup Hub -> 100% at Delivery Location)
  const storedProgress =
    order.orderStatus === 'delivered' || order.orderStatus === 'arrived_at_customer'
      ? 100
      : order.agentLiveLocation?.progressPct ?? (isPickedUp ? 35 : 0);

  const [progressPct, setProgressPct] = useState<number>(storedProgress);
  const [isAutoSimulating, setIsAutoSimulating] = useState<boolean>(false);
  const [gpsConsentEnabled, setGpsConsentEnabled] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  // Sync local progress state when order changes or receives cross-tab updates
  useEffect(() => {
    const nextProgress =
      order.orderStatus === 'delivered' || order.orderStatus === 'arrived_at_customer'
        ? 100
        : order.agentLiveLocation?.progressPct ?? (isPickedUp ? 35 : 0);
    setProgressPct(nextProgress);
  }, [
    order.id,
    order.orderStatus,
    order.isPickupConfirmed,
    order.agentLiveLocation?.progressPct,
    order.agentLiveLocation?.updatedAt,
    isPickedUp,
  ]);

  // Compute current courier coordinates along the road route
  const agentPrePickupCoords: LatLngLiteral = useMemo(() => {
    if (agent?.currentLocation) {
      return { lat: agent.currentLocation.lat, lng: agent.currentLocation.lng };
    }
    return {
      lat: pickupHub.coords.lat - 0.018,
      lng: pickupHub.coords.lng + 0.014,
    };
  }, [agent?.currentLocation, pickupHub.coords]);

  const currentAgentCoords: LatLngLiteral = useMemo(() => {
    if (!isPickedUp) {
      return agentPrePickupCoords;
    }
    if (
      gpsConsentEnabled &&
      order.agentLiveLocation?.lat &&
      order.agentLiveLocation?.lng
    ) {
      return {
        lat: order.agentLiveLocation.lat,
        lng: order.agentLiveLocation.lng,
      };
    }
    return interpolateAlongPath(
      routeMetrics.path,
      pickupHub.coords,
      deliveryCoords,
      progressPct
    );
  }, [
    isPickedUp,
    gpsConsentEnabled,
    order.agentLiveLocation,
    routeMetrics.path,
    pickupHub.coords,
    deliveryCoords,
    progressPct,
    agentPrePickupCoords,
  ]);

  // Persist progress update into platformStore so Customer and Agent stay synced in real time
  const commitProgressUpdate = useCallback(
    (nextPct: number, markArrived?: boolean) => {
      const clamped = Math.max(0, Math.min(100, Math.round(nextPct)));
      setProgressPct(clamped);
      const nextCoords = interpolateAlongPath(
        routeMetrics.path,
        pickupHub.coords,
        deliveryCoords,
        clamped
      );
      platformStore.updateOrderLiveTracking(order.id, {
        lat: nextCoords.lat,
        lng: nextCoords.lng,
        progressPct: clamped,
        leg: clamped >= 100 || markArrived ? 'arrived' : 'to_delivery',
        markArrived: markArrived || clamped >= 100,
      });
    },
    [order.id, routeMetrics.path, pickupHub.coords, deliveryCoords]
  );

  // Auto-simulation timer along the computed road route
  useEffect(() => {
    if (!isAutoSimulating || !isPickedUp || isDelivered) return;

    const timer = setInterval(() => {
      setProgressPct((prev) => {
        if (prev >= 100) {
          setIsAutoSimulating(false);
          return 100;
        }
        const next = Math.min(100, prev + 5);
        const nextCoords = interpolateAlongPath(
          routeMetrics.path,
          pickupHub.coords,
          deliveryCoords,
          next
        );
        platformStore.updateOrderLiveTracking(order.id, {
          lat: nextCoords.lat,
          lng: nextCoords.lng,
          progressPct: next,
          leg: next >= 100 ? 'arrived' : 'to_delivery',
          markArrived: next >= 100,
        });
        return next;
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [isAutoSimulating, isPickedUp, isDelivered, order.id, routeMetrics.path, pickupHub.coords, deliveryCoords]);

  // Browser Geolocation watcher with explicit revocable end-user consent (Agent Mode)
  useEffect(() => {
    if (!gpsConsentEnabled || mode !== 'agent') return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsNotice('Device GPS is not available in this browser; showing road route instead.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsNotice('Sharing your live location with the customer.');
        platformStore.updateOrderLiveTracking(order.id, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          progressPct,
          leg: isPickedUp ? 'to_delivery' : 'to_pickup',
        });
      },
      () => {
        setGpsNotice('Location permission was declined; showing road route instead.');
        setGpsConsentEnabled(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [gpsConsentEnabled, mode, order.id, isPickedUp, progressPct]);

  const handleRouteComputed = useCallback(
    (data: { distanceMeters: number; durationMillis: number; path: LatLngLiteral[] }) => {
      setRouteMetrics(data);
    },
    []
  );

  const handleConfirmPickupNow = () => {
    platformStore.confirmOrderPickup(order.id);
    setGpsNotice('Pickup confirmed at hub! Customer real-time map tracking is now active.');
    setTimeout(() => setGpsNotice(null), 4000);
  };

  // Remaining distance & ETA calculations
  const totalKm = routeMetrics.distanceMeters / 1000;
  const totalMinutes = Math.max(4, Math.round(routeMetrics.durationMillis / 60000));
  const remainingFraction = isPickedUp ? Math.max(0, (100 - progressPct) / 100) : 1;
  const remainingKm = (totalKm * remainingFraction).toFixed(1);
  const remainingMins = Math.max(1, Math.ceil(totalMinutes * remainingFraction));

  const defaultCenter: LatLngLiteral = {
    lat: (pickupHub.coords.lat + deliveryCoords.lat) / 2,
    lng: (pickupHub.coords.lng + deliveryCoords.lng) / 2,
  };

  const routeOrigin = isPickedUp ? pickupHub.coords : agentPrePickupCoords;
  const routeDestination = isPickedUp ? deliveryCoords : pickupHub.coords;
  const polylineColor = accentColor || '#00A862';

  // ============================================================================
  // CUSTOMER GATE: Before the delivery agent picks up from the pickup location,
  // customer cannot track the courier's live GPS yet.
  // ============================================================================
  if (mode === 'customer' && !isPickedUp) {
    return (
      <div className="bg-surface border border-line rounded p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <Clock
              className="w-5 h-5 shrink-0"
              style={{ color: accentColor || '#00A862' }}
              strokeWidth={1.75}
            />
            <div>
              <h3 className="text-[15px] font-bold text-ink">
                Awaiting Courier Pickup at {pickupHub.hubName}
              </h3>
              <p className="text-[12px] text-muted">
                Real-time GPS map tracking unlocks automatically once your delivery agent picks up the package from the pickup location.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase bg-page border border-line text-ink shrink-0">
            Stage: {order.orderStatus.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
          <div className="p-3 bg-page border border-line rounded space-y-1">
            <div className="text-muted font-bold uppercase text-[11px]">
              1. Pickup Location (Hub)
            </div>
            <div className="font-bold text-ink">{pickupHub.hubName}</div>
            <div className="text-muted">{pickupHub.address}</div>
          </div>

          <div className="p-3 bg-page border border-line rounded space-y-1">
            <div className="text-muted font-bold uppercase text-[11px]">
              2. Assigned Courier
            </div>
            <div className="font-bold text-ink">
              {order.agentName || 'Assigning Nearest Accredited Rider'}
            </div>
            <div className="text-muted">
              {order.agentVehicle || 'Pending Hub Handover Scan'}
            </div>
          </div>

          <div className="p-3 bg-page border border-line rounded space-y-1">
            <div className="text-muted font-bold uppercase text-[11px]">
              3. Your Delivery Address
            </div>
            <div className="font-bold text-ink">{order.customerName}</div>
            <div className="text-muted">{order.deliveryAddress}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[12px]">
          <div className="flex items-center gap-1.5 text-muted">
            <ShieldCheck
              className="w-4 h-4 shrink-0"
              style={{ color: accentColor || '#00A862' }}
              strokeWidth={1.75}
            />
            <span>
              Safe Payment: ₦{order.totalAmount.toLocaleString()} is kept safe until you get your order.
            </span>
          </div>

          <button
            type="button"
            onClick={handleConfirmPickupNow}
            style={accentColor ? { backgroundColor: accentColor, color: '#FFFFFF' } : undefined}
            className={`px-3.5 h-9 rounded font-bold text-[12px] flex items-center gap-1.5 cursor-pointer ${
              accentColor ? '' : 'bg-primary text-on-primary hover:bg-primary-dark'
            }`}
          >
            <PackageCheck className="w-4 h-4" strokeWidth={1.75} />
            <span>Demo: Mark Picked Up to See Live Map</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded overflow-hidden">
      {/* Top Telemetry Header Bar */}
      <div className="p-4 border-b border-line flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Navigation
              className="w-4 h-4 shrink-0"
              style={{ color: accentColor || '#00A862' }}
              strokeWidth={1.75}
            />
            <h3 className="text-[15px] font-bold text-ink">
              {mode === 'agent'
                ? `Live Courier Route Map — ${order.orderNumber}`
                : `Live Delivery Progress — ${order.orderNumber}`}
            </h3>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-bold uppercase border"
              style={
                isPickedUp
                  ? accentColor
                    ? {
                        backgroundColor: `${accentColor}15`,
                        borderColor: accentColor,
                        color: accentColor,
                      }
                    : {
                        backgroundColor: '#E6FAF1',
                        borderColor: '#00A862',
                        color: '#00A862',
                      }
                  : undefined
              }
            >
              {isDelivered
                ? 'DELIVERED & VERIFIED'
                : isPickedUp
                ? 'PICKED UP • LIVE CUSTOMER TRACKING'
                : 'LEG 1: HEADING TO PICKUP HUB'}
            </span>
          </div>
          <p className="text-[12px] text-muted">
            {isPickedUp
              ? `Picked up from ${pickupHub.hubName} • En-route to ${order.deliveryAddress}`
              : `Proceed to ${pickupHub.hubName} (${pickupHub.address}) to pick up this order. Customer tracking activates after pickup.`}
          </p>
        </div>

        {/* Live Distance & ETA Badges */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 text-[12px]">
          <div className="px-3 py-1.5 bg-page border border-line rounded">
            <span className="text-muted">Distance: </span>
            <strong className="text-ink">
              {isDelivered ? '0.0 km' : `${remainingKm} km`}
            </strong>
          </div>
          <div className="px-3 py-1.5 bg-page border border-line rounded">
            <span className="text-muted">Live ETA: </span>
            <strong className="text-ink">
              {isDelivered
                ? 'Delivered'
                : progressPct >= 100
                ? 'Arrived at Doorstep'
                : `~${remainingMins} mins`}
            </strong>
          </div>
          <div className="px-3 py-1.5 bg-page border border-line rounded">
            <span className="text-muted">Route Progress: </span>
            <strong style={{ color: accentColor || '#00A862' }}>
              {isPickedUp ? `${progressPct}%` : 'Pre-Pickup'}
            </strong>
          </div>
        </div>
      </div>

      {gpsNotice && (
        <div className="px-4 py-2 bg-primary-tint border-b border-primary-dark text-[12px] font-bold text-primary-dark flex items-center justify-between">
          <span>{gpsNotice}</span>
          <button
            type="button"
            onClick={() => setGpsNotice(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Pickup & Delivery Route Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-line bg-page border-b border-line text-[12px]">
        <div className="p-3 flex items-start gap-2.5">
          <PackageCheck
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: accentColor || '#00A862' }}
            strokeWidth={1.75}
          />
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase text-muted">
              Pickup Location {isPickedUp ? '(Confirmed ✓)' : '(Pending)'}
            </div>
            <div className="font-bold text-ink truncate">{pickupHub.hubName}</div>
            <div className="text-muted truncate">{pickupHub.address}</div>
          </div>
        </div>

        <div className="p-3 flex items-start gap-2.5">
          <Truck
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: accentColor || '#00A862' }}
            strokeWidth={1.75}
          />
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase text-muted">
              Delivery Rider
            </div>
            <div className="font-bold text-ink truncate">
              {order.agentName || agent?.name || 'Tunde Balogun'} •{' '}
              {order.agentVehicle || agent?.vehiclePlate || 'KJA-512-AB'}
            </div>
            <div className="text-muted flex items-center gap-2">
              <span>{order.agentPhone || agent?.phone || '+234 813 777 6655'}</span>
              {order.pickedUpAt && (
                <span>
                  • Picked up{' '}
                  {new Date(order.pickedUpAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-sale shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase text-muted">
              Delivery Destination
            </div>
            <div className="font-bold text-ink truncate">{order.customerName}</div>
            <div className="text-muted truncate">{order.deliveryAddress}</div>
          </div>
        </div>
      </div>

      {/* Interactive Google Map Canvas */}
      <div className="w-full h-[380px] sm:h-[430px] relative bg-page">
        {!apiKey ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-sale" strokeWidth={1.75} />
            <div className="text-[14px] font-bold text-ink">
              Google Maps API Key Not Configured
            </div>
            <p className="text-[12px] text-muted max-w-md">
              Set VITE_GOOGLE_MAPS_API_KEY in your environment configuration to render live interactive maps.
            </p>
          </div>
        ) : (
          <APIProvider apiKey={apiKey}>
            <MapLoadGuard>
              <Map
                defaultCenter={defaultCenter}
                defaultZoom={12}
                mapId="DEMO_MAP_ID"
                gestureHandling="greedy"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                <RouteCanvasLayer
                  origin={routeOrigin}
                  destination={routeDestination}
                  strokeColor={polylineColor}
                  onRouteComputed={handleRouteComputed}
                />
                <MapMarkersLayer
                  pickupHub={pickupHub}
                  deliveryCoords={deliveryCoords}
                  deliveryAddress={order.deliveryAddress}
                  customerName={order.customerName}
                  agentCoords={currentAgentCoords}
                  agentName={order.agentName || agent?.name || 'Tunde Balogun'}
                  agentVehicle={order.agentVehicle || agent?.vehiclePlate || 'KJA-512-AB'}
                  isPickedUp={isPickedUp}
                  isDelivered={isDelivered}
                  progressPct={progressPct}
                  accentColor={accentColor}
                />
              </Map>
            </MapLoadGuard>
          </APIProvider>
        )}
      </div>

      {/* Live Progress Bar & Action Controls */}
      <div className="p-4 bg-surface border-t border-line space-y-3">
        {/* Progress Bar */}
        {isPickedUp && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-bold text-ink">
                Pickup Hub ({pickupHub.hubName})
              </span>
              <span className="font-bold" style={{ color: accentColor || '#00A862' }}>
                {progressPct >= 100
                  ? 'Arrived at Buyer Location — Ready for QR Scan'
                  : `${progressPct}% of Route Completed`}
              </span>
              <span className="font-bold text-ink">
                Buyer ({order.customerName})
              </span>
            </div>
            <div className="w-full h-2.5 bg-page border border-line rounded overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: accentColor || '#00D27A',
                }}
              />
            </div>
          </div>
        )}

        {/* Controls for DELIVERY AGENT */}
        {mode === 'agent' && !isDelivered && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {!isPickedUp ? (
              <div className="flex flex-wrap items-center gap-2 w-full justify-between">
                <div className="text-[12px] text-muted">
                  Step 1: Arrive at <strong>{pickupHub.hubName}</strong> and confirm package pickup to begin customer real-time tracking.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {onScanPickupQr && (
                    <button
                      type="button"
                      onClick={onScanPickupQr}
                      className="px-3.5 h-10 border border-line bg-surface hover:bg-page text-ink font-bold rounded text-[12px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" strokeWidth={1.75} />
                      <span>Scan Hub Pickup QR</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleConfirmPickupNow}
                    className="px-4 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[13px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
                    <span>Confirm Pickup from Hub (Start Customer Live Map)</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAutoSimulating((v) => !v)}
                    className="px-3.5 h-10 bg-primary hover:bg-primary-dark text-on-primary font-bold rounded text-[12px] flex items-center gap-1.5 cursor-pointer"
                  >
                    {isAutoSimulating ? (
                      <>
                        <Pause className="w-4 h-4" strokeWidth={1.75} />
                        <span>Pause Live Drive</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" strokeWidth={1.75} />
                        <span>Simulate Live Drive</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => commitProgressUpdate(Math.min(100, progressPct + 20))}
                    disabled={progressPct >= 100}
                    className="px-3 h-10 border border-line bg-surface hover:bg-page text-ink font-bold rounded text-[12px] cursor-pointer disabled:opacity-50"
                  >
                    Advance +20%
                  </button>

                  <button
                    type="button"
                    onClick={() => commitProgressUpdate(100, true)}
                    disabled={progressPct >= 100 && order.orderStatus === 'arrived_at_customer'}
                    className="px-3 h-10 border border-line bg-surface hover:bg-page text-ink font-bold rounded text-[12px] cursor-pointer disabled:opacity-50"
                  >
                    Mark Arrived at Buyer
                  </button>

                  {/* Explicit, revocable GPS location sharing consent toggle (GMP Compliance) */}
                  <label className="inline-flex items-center gap-1.5 px-3 h-10 border border-line rounded bg-page text-[12px] text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gpsConsentEnabled}
                      onChange={(e) => setGpsConsentEnabled(e.target.checked)}
                      className="accent-primary-dark"
                    />
                    <LocateFixed className="w-3.5 h-3.5 text-primary-dark" strokeWidth={1.75} />
                    <span>Share Device GPS (Consent)</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenQrModal && (
                    <button
                      type="button"
                      onClick={() => onOpenQrModal(order)}
                      className="px-4 h-10 bg-dark text-white font-bold rounded text-[12px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-primary" strokeWidth={1.75} />
                      <span>Show Handover QR to Buyer</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Controls for CUSTOMER */}
        {mode === 'customer' && isPickedUp && !isDelivered && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAutoSimulating((v) => !v)}
                className="px-3 h-9 border border-line bg-page hover:bg-surface text-ink font-bold rounded text-[12px] flex items-center gap-1.5 cursor-pointer"
              >
                {isAutoSimulating ? (
                  <>
                    <Pause className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Pause Rider Movement</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Watch Rider Move on Map</span>
                  </>
                )}
              </button>

              {order.agentPhone && (
                <a
                  href={`tel:${order.agentPhone}`}
                  className="px-3 h-9 border border-line bg-surface hover:bg-page text-ink font-bold rounded text-[12px] inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Call Courier ({order.agentName?.split(' ')[0] || 'Rider'})</span>
                </a>
              )}
            </div>

            {onOpenQrModal && (
              <button
                type="button"
                onClick={() => onOpenQrModal(order)}
                style={accentColor ? { backgroundColor: accentColor } : undefined}
                className={`px-4 h-10 font-bold rounded text-[12px] flex items-center gap-1.5 cursor-pointer ${
                  accentColor
                    ? 'text-white hover:opacity-95'
                    : 'bg-primary hover:bg-primary-dark text-on-primary'
                }`}
              >
                <QrCode className="w-4 h-4" strokeWidth={1.75} />
                <span>Scan Courier QR on Arrival</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
