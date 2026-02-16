package com.example.potiongo.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.GetUserInfoUseCase
import com.example.potiongo.domain.GetUserInfoUseCaseResult
import com.example.potiongo.domain.LogoutUseCase
import com.example.potiongo.domain.LogoutUseCaseResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val logoutUseCase: LogoutUseCase ,
    private val getUserInfoUseCase: GetUserInfoUseCase
): ViewModel() {

    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Idle)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadUserInfo()
    }

    fun loadUserInfo() {
        viewModelScope.launch {
            _uiState.value = ProfileUiState.Loading
            _uiState.value = when (val res = getUserInfoUseCase()) {
                is GetUserInfoUseCaseResult.Success -> ProfileUiState.Loaded(res.user)
                is GetUserInfoUseCaseResult.Error -> ProfileUiState.Error("Impossible de charger le profil")
            }
        }
    }
    fun signOut() {
        viewModelScope.launch {
            when (val res = logoutUseCase()) {
                is LogoutUseCaseResult.Success -> {
                    _uiState.value = ProfileUiState.SignedOut
                }
                is LogoutUseCaseResult.ErrorAuth -> {
                    _uiState.value = ProfileUiState.Error(res.errorMessage)
                }
            }
        }
    }
}
