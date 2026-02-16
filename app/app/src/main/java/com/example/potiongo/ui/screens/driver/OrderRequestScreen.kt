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
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
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
                .height(250.dp),
            cameraPositionState = cameraPositionState
        ) {
            Marker(
                state = MarkerState(position = markerPosition),
                title = "Lieu de livraison"
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = state.dropoffAddress,
            style = MaterialTheme.typography.bodyLarge
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "${state.itemCount} article(s)",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.weight(1f))

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
