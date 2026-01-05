package com.example.potiongo.ui.screen.signup

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.services.AuthService
import com.google.firebase.Firebase
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch


class SignUpViewModel : ViewModel() {
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
            val auth = AuthService(FirebaseAuth.getInstance())
            auth.signUp(_uiState.value.email, _uiState.value.password)
        }
    }

}


data class SignUpUiState(
    val email: String = "",
    val password: String = "",
    val confirmPassword : String = "",
    val hasError:  Boolean = false
)