package com.example.potiongo.ui.screens.auth.emailVerif

import com.example.potiongo.ui.screens.auth.login.LoginUiState

sealed class EmailVerifUiState {
        data object Idle : EmailVerifUiState()
        data object Success : EmailVerifUiState()
}
