package com.example.potiongo.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Snackbar
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.potiongo.R
import com.example.potiongo.data.Order
import com.example.potiongo.ui.component.BottomBarNavigation
import com.example.potiongo.ui.component.PotionGoScaffold
import com.example.potiongo.ui.component.ProductGrid
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.Polyline
import com.google.maps.android.compose.rememberCameraPositionState

@Composable
fun HomeScreen(
    homeViewModel: HomeViewModel = hiltViewModel(),
    bottomBarNavigation: BottomBarNavigation,
    onSelectProduct: (String) -> Unit,
    onOrderClick: (Order) -> Unit = {},
    onTrackOrder: (String) -> Unit = {},
    onRateOrder: (String) -> Unit = {}
) {
    val uiState by homeViewModel.uiState.collectAsState()
    val product by homeViewModel.products.collectAsState()
    val driverLoc by homeViewModel.driverLocation.collectAsState()

    PotionGoScaffold(
        title = stringResource(R.string.app_display_name),
        showBottomBar = true,
        bottomBarNavigation = bottomBarNavigation
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            when (val state = uiState) {
                is HomeUiState.CustomerView -> {
                    // Navigate to rating when delivery is complete
                    val deliveredOrderId = state.lastDeliveredOrderId
                    if (deliveredOrderId != null) {
                        LaunchedEffect(deliveredOrderId) {
                            homeViewModel.clearDeliveredFlag()
                            onRateOrder(deliveredOrderId)
                        }
                    }

                    CustomerContent(
                        activeOrder = state.activeOrder,
                        orderDelivered = state.orderDelivered,
                        driverLocation = driverLoc,
                        products = product,
                        onSelectProduct = onSelectProduct,
                        onTrackOrder = onTrackOrder,
                        onDismissDelivered = { homeViewModel.clearDeliveredFlag() }
                    )
                }
                is HomeUiState.DriverView -> {
                    // Navigate to rating after driver completes delivery
                    val pendingRating = state.pendingRatingOrderId
                    if (pendingRating != null) {
                        LaunchedEffect(pendingRating) {
                            homeViewModel.clearPendingRating()
                            onRateOrder(pendingRating)
                        }
                    }

                    DriverLocationSetup(
                        onStartLocation = { homeViewModel.startLocationTracking() }
                    )

                    val deliveryState = state.deliveryState
                    if (deliveryState != null) {
                        DriverDeliveryContent(
                            deliveryState = deliveryState,
                            onCodeChange = { homeViewModel.updateDeliveryCode(it) },
                            onValidate = { homeViewModel.validateDeliveryCode() }
                        )
                    } else {
                        DriverOrderList(
                            orders = state.orders,
                            onOrderClick = onOrderClick,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                }
                is HomeUiState.Error -> {}
                is HomeUiState.ErrorProduct -> {}
            }
        }
    }
}

// ── Customer ──

@Composable
private fun CustomerContent(
    activeOrder: Order?,
    orderDelivered: Boolean,
    driverLocation: DriverLocation?,
    products: List<com.example.potiongo.data.Product>,
    onSelectProduct: (String) -> Unit,
    onTrackOrder: (String) -> Unit,
    onDismissDelivered: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        if (orderDelivered) {
            Snackbar(
                modifier = Modifier.padding(16.dp),
                action = {
                    TextButton(onClick = onDismissDelivered) {
                        Text(stringResource(R.string.ok))
                    }
                }
            ) {
                Text(stringResource(R.string.order_delivered))
            }
        }

        if (activeOrder != null && driverLocation != null) {
            ActiveOrderCard(
                order = activeOrder,
                driverLocation = driverLocation,
                onClick = { onTrackOrder(activeOrder.id) }
            )
        }

        ProductGrid(products, onProductClick = onSelectProduct)
    }
}

@Composable
private fun ActiveOrderCard(
    order: Order,
    driverLocation: DriverLocation,
    onClick: () -> Unit
) {
    val driverPosition = LatLng(driverLocation.lat, driverLocation.lng)
    val dropoffPosition = LatLng(order.dropoff.lat, order.dropoff.lng)
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(driverPosition, 14f)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .clickable { onClick() },
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(
                text = stringResource(R.string.delivery_in_progress),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            if (order.dropoff.address.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = order.dropoff.address,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            GoogleMap(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp),
                cameraPositionState = cameraPositionState
            ) {
                Marker(
                    state = MarkerState(position = driverPosition),
                    title = stringResource(R.string.marker_driver),
                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)
                )
                Marker(
                    state = MarkerState(position = dropoffPosition),
                    title = stringResource(R.string.marker_delivery)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = stringResource(R.string.tap_to_track_order),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

// ── Driver: location setup ──

@Composable
private fun DriverLocationSetup(
    onStartLocation: () -> Unit
) {
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true
                || permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        if (granted) {
            onStartLocation()
        }
    }

    LaunchedEffect(Unit) {
        val hasFine = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (hasFine || hasCoarse) {
            onStartLocation()
        } else {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }
}

// ── Driver: delivery content ──

@Composable
private fun DriverDeliveryContent(
    deliveryState: DriverDeliveryState,
    onCodeChange: (String) -> Unit,
    onValidate: () -> Unit
) {
    when (deliveryState) {
        is DriverDeliveryState.Navigating -> {
            NavigatingContent(state = deliveryState)
        }
        is DriverDeliveryState.CodeEntry -> {
            CodeEntryContent(
                state = deliveryState,
                onCodeChange = onCodeChange,
                onValidate = onValidate
            )
        }
        is DriverDeliveryState.Validating -> {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }
    }
}

@Composable
private fun NavigatingContent(
    state: DriverDeliveryState.Navigating
) {
    val driverPosition = LatLng(state.driverLat, state.driverLng)
    val dropoffPosition = LatLng(state.dropoffLat, state.dropoffLng)
    val hasDriverLocation = state.driverLat != 0.0 || state.driverLng != 0.0

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(dropoffPosition, 15f)
    }

    if (hasDriverLocation) {
        LaunchedEffect(state.driverLat, state.driverLng) {
            val bounds = LatLngBounds.builder()
                .include(driverPosition)
                .include(dropoffPosition)
                .build()
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLngBounds(bounds, 100)
            )
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        GoogleMap(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            cameraPositionState = cameraPositionState
        ) {
            if (hasDriverLocation) {
                Marker(
                    state = MarkerState(position = driverPosition),
                    title = stringResource(R.string.marker_my_position),
                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)
                )
            }
            Marker(
                state = MarkerState(position = dropoffPosition),
                title = stringResource(R.string.marker_delivery_location),
                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
            )
            if (state.routePoints.isNotEmpty()) {
                Polyline(
                    points = state.routePoints,
                    color = androidx.compose.ui.graphics.Color(0xFF4285F4),
                    width = 12f
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (state.estimatedArrival.isNotEmpty()) {
            Text(
                text = stringResource(R.string.estimated_arrival, state.estimatedArrival),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(4.dp))
        }

        Text(
            text = state.dropoffAddress,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold
        )

        Spacer(modifier = Modifier.height(4.dp))

        if (hasDriverLocation) {
            Text(
                text = stringResource(R.string.distance_format, state.distanceMeters.toInt()),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun CodeEntryContent(
    state: DriverDeliveryState.CodeEntry,
    onCodeChange: (String) -> Unit,
    onValidate: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = stringResource(R.string.delivery_validation_title),
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = stringResource(R.string.ask_validation_code),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = state.enteredCode,
            onValueChange = onCodeChange,
            label = { Text(stringResource(R.string.validation_code_label)) },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            singleLine = true,
            isError = state.errorMessage != null,
            modifier = Modifier.fillMaxWidth()
        )

        if (state.errorMessage != null) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = state.errorMessage,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onValidate,
            enabled = state.enteredCode.length == 6,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(stringResource(R.string.validate_delivery))
        }
    }
}

// ── Driver: order list ──

@Composable
private fun DriverOrderList(
    orders: List<Order>,
    onOrderClick: (Order) -> Unit = {},
    modifier: Modifier = Modifier
) {
    if (orders.isEmpty()) {
        Column(
            modifier = modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = stringResource(R.string.no_orders_available),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    } else {
        LazyColumn(
            modifier = modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(orders) { order ->
                OrderCard(order = order, onClick = { onOrderClick(order) })
            }
        }
    }
}

@Composable
private fun OrderCard(order: Order, onClick: () -> Unit = {}) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = stringResource(R.string.order_label),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = order.status,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = stringResource(R.string.items_count, order.items.size),
                style = MaterialTheme.typography.bodyMedium
            )

            if (order.dropoff.address.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = order.dropoff.address,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
