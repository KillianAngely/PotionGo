package com.example.potiongo.ui.screens.auth.signup

import android.content.Context
import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.SignUpUseCase
import com.example.potiongo.domain.SignUpUseCaseResult
import com.example.potiongo.domain.SignWithGoogleUseCase
import com.example.potiongo.domain.SignWithGoogleUseCaseResult
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
    private val signUpUseCase: SignUpUseCase,
    private  val signWithGoogleUseCase: SignWithGoogleUseCase
): ViewModel(){
    private val _uiState = MutableStateFlow<SignUpUiState>(SignUpUiState.Idle)
    val uiState: StateFlow<SignUpUiState> = _uiState.asStateFlow()

    var email by mutableStateOf("")
        private set

    var password by mutableStateOf("")
        private set

    var firstName by mutableStateOf("")
        private set

    var lastName by mutableStateOf("")
        private set

    var role by mutableStateOf("customer")
        private set

    fun updateRole(roleInput: String) {
        role = roleInput
    }

    fun updateFirstname(firstNameInput: String){
        firstName = firstNameInput
    }

    fun updateLastname(lastnameInput: String){
        lastName = lastnameInput
    }

    fun updateEmail(emailInput: String) {
        email = emailInput
    }
    fun updatePassword(passwordInput: String) {
        password = passwordInput
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
            when(val res = signUpUseCase(email,password,firstName,lastName,role)){
                is SignUpUseCaseResult.Success -> {
                    _uiState.value = SignUpUiState.Success
                }
                is SignUpUseCaseResult.ErrorAuth -> {
                    _uiState.value = SignUpUiState.Error(res.errorMessage)
                }
            }
        }
    }

}

