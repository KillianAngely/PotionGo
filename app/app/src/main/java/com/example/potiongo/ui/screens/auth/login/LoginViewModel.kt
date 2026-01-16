package com.example.potiongo.ui.screens.auth.login

import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.LoginUserUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject


@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUserUseCase: LoginUserUseCase
): ViewModel() {
    private val _uiState = MutableStateFlow(LoginUiState())
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

    fun login(){
        viewModelScope.launch {
            val result = loginUserUseCase(email,password)
            if(result.isSuccess){
                Log.d("result.isFailure","I PASS HERE SUCCESS")
            }else{
                Log.d("result.isFailure","I PASS HERE ERROR")
                _uiState.update { currentState ->
                    currentState.copy( hasNetworkError = true)
                }
            }

        }
    }
}