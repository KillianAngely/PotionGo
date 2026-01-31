package com.example.potiongo.ui.screens.auth.login

import android.app.Activity
import android.content.Context
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.LoginUseCase
import com.example.potiongo.domain.LoginUseCaseResult
import com.example.potiongo.domain.SignWithGoogleUseCase
import com.example.potiongo.domain.SignWithGoogleUseCaseResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject


@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private  val signWithGoogleUseCase: SignWithGoogleUseCase
): ViewModel() {
    private val _uiState = MutableStateFlow<LoginUiState>(LoginUiState.Idle)
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    var email by mutableStateOf("")
        private set

    var password by mutableStateOf("")
        private set

    fun updateEmail(emailInput: String) {
        email = emailInput
    }
    fun updatePassword(passwordInput: String) {
        password = passwordInput
    }

    fun signWithGoogle(activityContext: Context) {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            when(val res = signWithGoogleUseCase(activityContext)) {
                is SignWithGoogleUseCaseResult.Success -> {
                    _uiState.value = LoginUiState.Success
                }
                is SignWithGoogleUseCaseResult.ErrorAuth -> {
                    _uiState.value = LoginUiState.Error(res.errorMessage)
                }
            }
        }
    }

    fun login() {
        viewModelScope.launch {
            _uiState.value = LoginUiState.Loading
            when(val res = loginUseCase(email, password)) {
                is LoginUseCaseResult.Success -> {
                    _uiState.value = LoginUiState.Success
                }
                is LoginUseCaseResult.ErrorAuth -> {
                    _uiState.value = LoginUiState.Error(res.errorMessage)
                }
            }
        }
    }
}