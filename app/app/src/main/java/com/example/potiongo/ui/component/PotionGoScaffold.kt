package com.example.potiongo.ui.component

import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import com.example.potiongo.R

data class BottomBarNavigation(
    val goToHome: () -> Unit,
    val goToCart: () -> Unit,
    val goToHistory: () -> Unit,
    val goToProfile: () -> Unit
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PotionGoScaffold(
    title: String,
    modifier: Modifier = Modifier,
    showBottomBar: Boolean = false,
    onBack: (() -> Unit)? = null,
    bottomBarNavigation: BottomBarNavigation? = null,
    content: @Composable (PaddingValues) -> Unit
) {
    Scaffold(
        modifier = modifier,
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = {
                    if (onBack != null) {
                        IconButton(onClick = onBack) {
                            Icon(
                                Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = stringResource(R.string.back_button)
                            )
                        }
                    }
                }
            )
        },
        bottomBar = {
            if (showBottomBar && bottomBarNavigation != null) {
                PotionGoBottomBar(navigation = bottomBarNavigation)
            }
        },
        content = content
    )
}
