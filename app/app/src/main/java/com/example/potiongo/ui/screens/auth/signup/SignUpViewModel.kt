package com.example.potiongo.ui.screens.auth.signup

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.services.AuthService
import com.example.potiongo.services.CloudFunctionsService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject


@HiltViewModel
class SignUpViewModel @Inject constructor(
    private val auth: AuthService,
    private val cloudFunction : CloudFunctionsService
): ViewModel(){
    private val _uiState = MutableStateFlow(SignUpUiState())
    val uiState: StateFlow<SignUpUiState> = _uiState.asStateFlow()
    fun updateEmail(email: String) {
        _uiState.update { currentState ->
            currentState.copy(email = email)
        }
    }

    fun updatePassword(password: String) {
        _uiState.update { currentState ->
            currentState.copy(password = password)
        }
    }

    fun updateConfirmPassword(confirmPassword: String) {
        _uiState.update { currentState ->
            currentState.copy(confirmPassword = confirmPassword)
        }
    }


    fun signUp() {
        viewModelScope.launch {
            auth.signUp(_uiState.value.email, _uiState.value.password)
            cloudFunction.setUserRole("customer")
        }
    }

}


data class SignUpUiState(
    val email: String = "",
    val password: String = "",
    val confirmPassword : String = "",
    val hasError:  Boolean = false
)