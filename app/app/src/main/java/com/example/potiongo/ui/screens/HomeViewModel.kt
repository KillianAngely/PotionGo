package com.example.potiongo.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.LogoutUseCase
import com.example.potiongo.domain.LogoutUseCaseResult
import com.example.potiongo.services.AuthService
import com.example.potiongo.ui.screens.auth.login.LoginUiState
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class HomeViewModel @Inject constructor(
    val logoutUseCase: LogoutUseCase
): ViewModel() {
    private val _uiState = MutableStateFlow<HomeUiState>(HomeUiState.Idle)
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()


    fun signOut(){
        viewModelScope.launch {
            when(val res = logoutUseCase()){
                is LogoutUseCaseResult.ErrorAuth -> {
                    _uiState.value = HomeUiState.Error(res.errorMessage)
                }
                is LogoutUseCaseResult.Success -> {
                    _uiState.value = HomeUiState.IsSignOut
                }
            }
        }
    }
}

sealed class HomeUiState{
    data object Idle : HomeUiState()
    data object IsSignOut : HomeUiState()
    data class Error(val error : String) : HomeUiState()
}