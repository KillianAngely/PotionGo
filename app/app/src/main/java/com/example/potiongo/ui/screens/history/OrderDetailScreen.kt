package com.example.potiongo.ui.screens.history

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.potiongo.R
import com.example.potiongo.data.OrderDetail
import com.example.potiongo.data.OrderDetailItem
import com.example.potiongo.ui.component.PotionGoScaffold
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState

@Composable
fun OrderDetailScreen(
    onBack: () -> Unit = {},
    onUserClick: (String) -> Unit = {},
    viewModel: OrderDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    PotionGoScaffold(
        title = stringResource(R.string.order_detail),
        onBack = onBack
    ) { paddingValues ->
        when (val state = uiState) {
            is OrderDetailUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            is OrderDetailUiState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = state.message,
                        color = MaterialTheme.colorScheme.error,
                        textAlign = TextAlign.Center
                    )
                }
            }

            is OrderDetailUiState.Success -> {
                OrderDetailContent(
                    detail = state.detail,
                    onUserClick = onUserClick,
                    modifier = Modifier.padding(paddingValues)
                )
            }
        }
    }
}

@Composable
private fun OrderDetailContent(
    detail: OrderDetail,
    onUserClick: (String) -> Unit = {},
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Status
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = stringResource(R.string.status),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            StatusBadge(status = detail.order.status)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Driver
        Text(
            text = stringResource(R.string.driver),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(4.dp))
        val driverId = detail.order.driverId
        Text(
            text = detail.driverName ?: stringResource(R.string.not_assigned),
            style = MaterialTheme.typography.bodyMedium,
            color = if (detail.driverName != null)
                MaterialTheme.colorScheme.primary
            else
                MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = if (!driverId.isNullOrEmpty())
                Modifier.clickable { onUserClick(driverId) }
            else
                Modifier
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Delivery address
        Text(
            text = stringResource(R.string.delivery_address),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = detail.order.dropoff.address.ifEmpty { stringResource(R.string.not_provided) },
            style = MaterialTheme.typography.bodyMedium
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Map
        val dropoff = detail.order.dropoff
        if (dropoff.lat != 0.0 || dropoff.lng != 0.0) {
            val markerPosition = LatLng(dropoff.lat, dropoff.lng)
            val cameraPositionState = rememberCameraPositionState {
                position = CameraPosition.fromLatLngZoom(markerPosition, 14f)
            }

            GoogleMap(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                cameraPositionState = cameraPositionState
            ) {
                Marker(
                    state = MarkerState(position = markerPosition),
                    title = stringResource(R.string.delivery_location)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))
        }

        // Items
        Text(
            text = stringResource(R.string.items),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Header
        Row(modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.product_header), modifier = Modifier.weight(2f), fontWeight = FontWeight.SemiBold)
            Text(stringResource(R.string.qty_header), modifier = Modifier.weight(0.5f), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
            Text(stringResource(R.string.price_header), modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End)
            Text(stringResource(R.string.subtotal_header), modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End)
        }

        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

        detail.items.forEach { item ->
            OrderDetailItemRow(item)
        }

        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

        // Total
        val total = detail.items.sumOf { it.product.price * it.quantity }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = stringResource(R.string.total),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "%.2f \u20AC".format(total),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}

@Composable
private fun OrderDetailItemRow(item: OrderDetailItem) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
        Text(
            text = item.product.name,
            modifier = Modifier.weight(2f),
            maxLines = 1
        )
        Text(
            text = "${item.quantity}",
            modifier = Modifier.weight(0.5f),
            textAlign = TextAlign.Center
        )
        Text(
            text = "%.2f \u20AC".format(item.product.price),
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.End
        )
        Text(
            text = "%.2f \u20AC".format(item.product.price * item.quantity),
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.End
        )
    }
}
