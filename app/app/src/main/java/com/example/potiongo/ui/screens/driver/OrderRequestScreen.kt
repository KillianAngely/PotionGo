package com.example.potiongo.ui.screens.driver

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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.potiongo.ui.component.PotionGoScaffold
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState

@Composable
fun OrderRequestScreen(
    viewModel: OrderRequestViewModel = hiltViewModel(),
    onAccepted: (String) -> Unit,
    onRejected: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    PotionGoScaffold(
        title = "Nouvelle commande",
        onBack = onRejected
    ) { paddingValues ->
        when (val state = uiState) {
            is OrderRequestUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            is OrderRequestUiState.Ready -> {
                ReadyContent(
                    state = state,
                    onAccept = { viewModel.accept() },
                    onReject = onRejected,
                    modifier = Modifier.padding(paddingValues)
                )
            }

            is OrderRequestUiState.Accepted -> {
                LaunchedEffect(Unit) {
                    onAccepted(state.orderId)
                }
            }

            is OrderRequestUiState.Error -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = state.message,
                        color = MaterialTheme.colorScheme.error,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = onRejected) {
                        Text("Retour")
                    }
                }
            }
        }
    }
}

@Composable
private fun ReadyContent(
    state: OrderRequestUiState.Ready,
    onAccept: () -> Unit,
    onReject: () -> Unit,
    modifier: Modifier = Modifier
) {
    val markerPosition = LatLng(state.dropoffLat, state.dropoffLng)
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(markerPosition, 14f)
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(
            text = "Livraison demandee",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(12.dp))

        GoogleMap(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp),
            cameraPositionState = cameraPositionState
        ) {
            Marker(
                state = MarkerState(position = markerPosition),
                title = "Lieu de livraison"
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = state.dropoffAddress,
            style = MaterialTheme.typography.bodyLarge
        )

        Spacer(modifier = Modifier.height(16.dp))
        HorizontalDivider()
        Spacer(modifier = Modifier.height(12.dp))

        // Section Client
        Text(
            text = "Client",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = state.customerName.ifEmpty { "Inconnu" },
            style = MaterialTheme.typography.bodyLarge
        )
        Text(
            text = state.customerEmail,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(16.dp))
        HorizontalDivider()
        Spacer(modifier = Modifier.height(12.dp))

        // Section Produits
        Text(
            text = "Articles",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Header
        Row(modifier = Modifier.fillMaxWidth()) {
            Text("Produit", modifier = Modifier.weight(2f), fontWeight = FontWeight.SemiBold)
            Text("Qte", modifier = Modifier.weight(0.5f), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
            Text("Prix", modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End)
            Text("Sous-total", modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End)
        }

        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

        state.items.forEach { item ->
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp)) {
                Text(
                    text = item.name,
                    modifier = Modifier.weight(2f),
                    maxLines = 1
                )
                Text(
                    text = "${item.quantity}",
                    modifier = Modifier.weight(0.5f),
                    textAlign = TextAlign.Center
                )
                Text(
                    text = "%.2f €".format(item.price),
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.End
                )
                Text(
                    text = "%.2f €".format(item.price * item.quantity),
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.End
                )
            }
        }

        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "Total",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "%.2f €".format(state.total),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = onReject,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.outlinedButtonColors(
                    contentColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text("Refuser")
            }
            Button(
                onClick = onAccept,
                modifier = Modifier.weight(1f)
            ) {
                Text("Accepter")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}
