package com.example.potiongo.ui.screens.checkout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.potiongo.data.Cart
import com.example.potiongo.ui.component.PotionGoScaffold
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState

@Composable
fun CheckoutScreen(
    viewModel: CheckoutViewModel = hiltViewModel(),
    onBack: () -> Unit = {},
    onOrderPlaced: () -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()

    PotionGoScaffold(
        title = "Paiement",
        onBack = onBack
    ) { paddingValues ->
        when (val state = uiState) {
            is CheckoutUiState.Ready -> {
                ReadyContent(
                    state = state,
                    onMapClick = { lat, lng -> viewModel.updateSelectedLocation(lat, lng) },
                    onAddressChange = { viewModel.updateAddress(it) },
                    onConfirm = { viewModel.placeOrder() },
                    modifier = Modifier.padding(paddingValues)
                )
            }

            is CheckoutUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            is CheckoutUiState.Success -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Commande confirmee !",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "Votre code de validation :",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = state.validationCode,
                        style = MaterialTheme.typography.displayMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        letterSpacing = 8.sp
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Communiquez ce code au livreur a la reception",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(32.dp))
                    Button(onClick = onOrderPlaced) {
                        Text("Retour a l'accueil")
                    }
                }
            }

            is CheckoutUiState.Error -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = state.error,
                        color = MaterialTheme.colorScheme.error,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.placeOrder() }) {
                        Text("Réessayer")
                    }
                }
            }
        }
    }
}

@Composable
private fun ReadyContent(
    state: CheckoutUiState.Ready,
    onMapClick: (Double, Double) -> Unit,
    onAddressChange: (String) -> Unit,
    onConfirm: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Récapitulatif",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Header row
        Row(modifier = Modifier.fillMaxWidth()) {
            Text("Produit", modifier = Modifier.weight(2f), fontWeight = FontWeight.SemiBold)
            Text("Qté", modifier = Modifier.weight(0.5f), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
            Text("Prix", modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End)
            Text("Sous-total", modifier = Modifier.weight(1f), fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End)
        }

        HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(state.items) { cart ->
                InvoiceRow(cart)
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

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Lieu de livraison",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        val markerPosition = LatLng(state.selectedLat, state.selectedLng)
        val cameraPositionState = rememberCameraPositionState {
            position = CameraPosition.fromLatLngZoom(markerPosition, 12f)
        }

        LaunchedEffect(state.selectedLat, state.selectedLng) {
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLng(LatLng(state.selectedLat, state.selectedLng))
            )
        }

        GoogleMap(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp),
            cameraPositionState = cameraPositionState,
            onMapClick = { latLng ->
                onMapClick(latLng.latitude, latLng.longitude)
            }
        ) {
            Marker(
                state = MarkerState(position = markerPosition),
                title = "Lieu de livraison"
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = state.deliveryAddress,
            onValueChange = onAddressChange,
            label = { Text("Adresse de livraison") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = false,
            maxLines = 3
        )

        Spacer(modifier = Modifier.height(16.dp))

        Button(
            onClick = onConfirm,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Confirmer la commande")
        }
    }
}

@Composable
private fun InvoiceRow(cart: Cart) {
    Row(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = cart.product.name,
            modifier = Modifier.weight(2f),
            maxLines = 1
        )
        Text(
            text = "${cart.quantity}",
            modifier = Modifier.weight(0.5f),
            textAlign = TextAlign.Center
        )
        Text(
            text = "%.2f €".format(cart.product.price),
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.End
        )
        Text(
            text = "%.2f €".format(cart.product.price * cart.quantity),
            modifier = Modifier.weight(1f),
            textAlign = TextAlign.End
        )
    }
}
