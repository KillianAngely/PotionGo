package com.example.potiongo.ui.screens.rating

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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Star
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import com.example.potiongo.ui.component.PotionGoScaffold

@Composable
fun RatingScreen(
    viewModel: RatingViewModel = hiltViewModel(),
    onDone: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    PotionGoScaffold(
        title = "",
        onBack = onDone
    ) { paddingValues ->
        when (val state = uiState) {
            is RatingUiState.Loading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }

            is RatingUiState.Ready -> {
                RatingContent(
                    state = state,
                    onRatingChange = { viewModel.updateRating(it) },
                    onCommentChange = { viewModel.updateComment(it) },
                    onSubmit = { viewModel.submit() },
                    onSkip = onDone,
                    modifier = Modifier.padding(paddingValues)
                )
            }

            is RatingUiState.Submitted -> {
                SubmittedContent(
                    onDone = onDone,
                    modifier = Modifier.padding(paddingValues)
                )
            }

            is RatingUiState.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = state.message,
                            color = MaterialTheme.colorScheme.error,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = onDone) {
                            Text(stringResource(R.string.back))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RatingContent(
    state: RatingUiState.Ready,
    onRatingChange: (Int) -> Unit,
    onCommentChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onSkip: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(32.dp))

        Text(
            text = if (state.isDriver)
                stringResource(R.string.rate_your_driver)
            else
                stringResource(R.string.rate_your_customer),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = state.revieweeName,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(32.dp))

        // Star rating
        Row(
            horizontalArrangement = Arrangement.Center
        ) {
            for (i in 1..5) {
                Icon(
                    imageVector = if (i <= state.selectedRating) Icons.Filled.Star else Icons.Outlined.Star,
                    contentDescription = "$i stars",
                    tint = if (i <= state.selectedRating)
                        MaterialTheme.colorScheme.primary
                    else
                        MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .size(48.dp)
                        .clickable(enabled = !state.isSending) { onRatingChange(i) }
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Comment field only for customer rating driver
        if (state.isDriver) {
            OutlinedTextField(
                value = state.comment,
                onValueChange = onCommentChange,
                label = { Text(stringResource(R.string.leave_comment)) },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                maxLines = 5,
                enabled = !state.isSending
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        if (state.error != null) {
            Text(
                text = state.error,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall
            )
            Spacer(modifier = Modifier.height(8.dp))
        }

        Spacer(modifier = Modifier.weight(1f))

        Row(modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(
                onClick = onSkip,
                modifier = Modifier.weight(1f),
                enabled = !state.isSending
            ) {
                Text(stringResource(R.string.skip_rating))
            }

            Spacer(modifier = Modifier.width(12.dp))

            Button(
                onClick = onSubmit,
                modifier = Modifier.weight(1f),
                enabled = !state.isSending && state.selectedRating > 0
            ) {
                if (state.isSending) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text(stringResource(R.string.submit_rating))
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun SubmittedContent(
    onDone: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
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
            text = stringResource(R.string.rating_submitted),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(onClick = onDone) {
            Text(stringResource(R.string.ok))
        }
    }
}
