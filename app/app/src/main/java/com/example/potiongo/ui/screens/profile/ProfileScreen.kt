package com.example.potiongo.ui.screens.profile

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
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
import com.example.potiongo.ui.component.BottomBarNavigation
import com.example.potiongo.ui.component.PotionGoScaffold

@Composable
fun ProfileScreen(
    bottomBarNavigation: BottomBarNavigation,
    onSignOut: () -> Unit = {},
    profileViewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by profileViewModel.uiState.collectAsState()

    LaunchedEffect(uiState) {
        if (uiState is ProfileUiState.SignedOut) {
            onSignOut()
        }
    }

    PotionGoScaffold(
        title = stringResource(R.string.profile),
        showBottomBar = true,
        bottomBarNavigation = bottomBarNavigation
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            when (val state = uiState) {
                is ProfileUiState.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.padding(top = 32.dp)
                    )
                }
                is ProfileUiState.Loaded -> {
                    LoadedContent(
                        state = state,
                        onEdit = { profileViewModel.startEditing() }
                    )
                }
                is ProfileUiState.Editing -> {
                    EditingContent(
                        state = state,
                        onFirstNameChange = { profileViewModel.updateFirstName(it) },
                        onLastNameChange = { profileViewModel.updateLastName(it) },
                        onEmailChange = { profileViewModel.updateEmail(it) },
                        onSave = { profileViewModel.saveProfile() },
                        onCancel = { profileViewModel.cancelEditing() }
                    )
                }
                is ProfileUiState.Saved -> {
                    SavedContent(
                        emailChanged = state.emailChanged,
                        onDismiss = { profileViewModel.onSavedAcknowledged() }
                    )
                }
                is ProfileUiState.Error -> {
                    Text(
                        text = state.error,
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(top = 32.dp)
                    )
                }
                else -> {}
            }

            Spacer(modifier = Modifier.weight(1f))

            if (uiState !is ProfileUiState.Editing && uiState !is ProfileUiState.Saved) {
                Button(
                    onClick = { profileViewModel.signOut() },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text(stringResource(R.string.sign_out))
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
private fun LoadedContent(
    state: ProfileUiState.Loaded,
    onEdit: () -> Unit
) {
    Spacer(modifier = Modifier.height(24.dp))

    Row(
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "${state.user.firstName} ${state.user.lastName}",
            style = MaterialTheme.typography.headlineMedium
        )
        IconButton(onClick = onEdit) {
            Icon(
                Icons.Default.Edit,
                contentDescription = stringResource(R.string.edit_profile),
                tint = MaterialTheme.colorScheme.primary
            )
        }
    }

    Spacer(modifier = Modifier.height(8.dp))

    Text(
        text = state.user.email,
        style = MaterialTheme.typography.bodyLarge,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

@Composable
private fun EditingContent(
    state: ProfileUiState.Editing,
    onFirstNameChange: (String) -> Unit,
    onLastNameChange: (String) -> Unit,
    onEmailChange: (String) -> Unit,
    onSave: () -> Unit,
    onCancel: () -> Unit
) {
    Spacer(modifier = Modifier.height(24.dp))

    OutlinedTextField(
        value = state.firstName,
        onValueChange = onFirstNameChange,
        label = { Text(stringResource(R.string.first_name)) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        enabled = !state.isSaving
    )

    Spacer(modifier = Modifier.height(12.dp))

    OutlinedTextField(
        value = state.lastName,
        onValueChange = onLastNameChange,
        label = { Text(stringResource(R.string.last_name)) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        enabled = !state.isSaving
    )

    Spacer(modifier = Modifier.height(12.dp))

    OutlinedTextField(
        value = state.email,
        onValueChange = onEmailChange,
        label = { Text(stringResource(R.string.email_input)) },
        modifier = Modifier.fillMaxWidth(),
        singleLine = true,
        enabled = !state.isSaving
    )

    if (state.error != null) {
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = state.error,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall
        )
    }

    Spacer(modifier = Modifier.height(24.dp))

    Row(modifier = Modifier.fillMaxWidth()) {
        OutlinedButton(
            onClick = onCancel,
            modifier = Modifier.weight(1f),
            enabled = !state.isSaving
        ) {
            Text(stringResource(R.string.cancel))
        }

        Spacer(modifier = Modifier.width(12.dp))

        Button(
            onClick = onSave,
            modifier = Modifier.weight(1f),
            enabled = !state.isSaving
        ) {
            if (state.isSaving) {
                CircularProgressIndicator(
                    modifier = Modifier.height(20.dp).width(20.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text(stringResource(R.string.save))
            }
        }
    }
}

@Composable
private fun SavedContent(
    emailChanged: Boolean,
    onDismiss: () -> Unit
) {
    Spacer(modifier = Modifier.height(32.dp))

    Icon(
        Icons.Default.CheckCircle,
        contentDescription = null,
        tint = MaterialTheme.colorScheme.primary,
        modifier = Modifier.height(48.dp).width(48.dp)
    )

    Spacer(modifier = Modifier.height(16.dp))

    Text(
        text = stringResource(R.string.profile_updated),
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.Bold
    )

    if (emailChanged) {
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = stringResource(R.string.email_verification_required),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center
        )
    }

    Spacer(modifier = Modifier.height(24.dp))

    Button(onClick = onDismiss) {
        Text(stringResource(R.string.ok))
    }
}
