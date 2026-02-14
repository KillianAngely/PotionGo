package com.example.potiongo.ui.screens.profile

import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.LogoutUseCase
import com.example.potiongo.domain.LogoutUseCaseResult
import com.example.potiongo.ui.screens.HomeUiState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject


@HiltViewModel
class ProfileViewModel @Inject constructor(
    val logoutUseCase: LogoutUseCase
): ViewModel() {
    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Idle)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    fun signOut(){
        viewModelScope.launch {
            when(val res = logoutUseCase()){
                is LogoutUseCaseResult.ErrorAuth -> {
                    _uiState.value = ProfileUiState.Error(res.errorMessage)
                }
                is LogoutUseCaseResult.Success -> {
                    _uiState.value = ProfileUiState.IsSignOut
                }
            }
        }
    }
}