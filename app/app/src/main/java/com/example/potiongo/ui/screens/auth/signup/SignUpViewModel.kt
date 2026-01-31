package com.example.potiongo.ui.screens.auth.signup

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.SignWithGoogleUseCase
import com.example.potiongo.domain.SignWithGoogleUseCaseResult
import com.example.potiongo.services.AuthService
import com.example.potiongo.services.CloudFunctionsService
import com.example.potiongo.ui.screens.auth.login.LoginUiState
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
    private val cloudFunction : CloudFunctionsService,
    private  val signWithGoogleUseCase: SignWithGoogleUseCase
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

    fun signWithGoogle(activityContext: Context) {
        viewModelScope.launch {

            when(val res = signWithGoogleUseCase(activityContext)) {
                is SignWithGoogleUseCaseResult.Success -> {
                    Log.d("TEST","YES")
                }
                is SignWithGoogleUseCaseResult.ErrorAuth -> {
                    Log.d("TEST","No")
                }
            }
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