package com.example.potiongo.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.potiongo.domain.GetDriverStatsUseCase
import com.example.potiongo.domain.GetDriverStatsUseCaseResult
import com.example.potiongo.domain.GetRoleUseCase
import com.example.potiongo.domain.GetRoleUseCaseResult
import com.example.potiongo.domain.GetUserInfoUseCase
import com.example.potiongo.domain.GetUserInfoUseCaseResult
import com.example.potiongo.domain.LogoutUseCase
import com.example.potiongo.domain.LogoutUseCaseResult
import com.example.potiongo.domain.UpdateProfileUseCase
import com.example.potiongo.domain.UpdateProfileUseCaseResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val logoutUseCase: LogoutUseCase,
    private val getUserInfoUseCase: GetUserInfoUseCase,
    private val updateProfileUseCase: UpdateProfileUseCase,
    private val getRoleUseCase: GetRoleUseCase,
    private val getDriverStatsUseCase: GetDriverStatsUseCase
): ViewModel() {

    private val _uiState = MutableStateFlow<ProfileUiState>(ProfileUiState.Idle)
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        loadUserInfo()
    }

    fun loadUserInfo() {
        viewModelScope.launch {
            _uiState.value = ProfileUiState.Loading
            when (val res = getUserInfoUseCase()) {
                is GetUserInfoUseCaseResult.Success -> {
                    _uiState.value = ProfileUiState.Loaded(res.user)
                    loadDriverStatsIfNeeded()
                }
                is GetUserInfoUseCaseResult.Error -> {
                    _uiState.value = ProfileUiState.Error("Impossible de charger le profil")
                }
            }
        }
    }

    private fun loadDriverStatsIfNeeded() {
        viewModelScope.launch {
            when (getRoleUseCase()) {
                is GetRoleUseCaseResult.Driver -> {
                    when (val statsResult = getDriverStatsUseCase()) {
                        is GetDriverStatsUseCaseResult.Success -> {
                            val current = _uiState.value
                            if (current is ProfileUiState.Loaded) {
                                _uiState.value = current.copy(driverStats = statsResult.stats)
                            }
                        }
                        is GetDriverStatsUseCaseResult.Error -> { /* silently ignore stats error */ }
                    }
                }
                else -> { /* not a driver, no stats needed */ }
            }
        }
    }

    fun startEditing() {
        val current = _uiState.value
        if (current is ProfileUiState.Loaded) {
            _uiState.value = ProfileUiState.Editing(
                firstName = current.user.firstName,
                lastName = current.user.lastName,
                email = current.user.email,
                originalEmail = current.user.email
            )
        }
    }

    fun updateFirstName(value: String) {
        val current = _uiState.value
        if (current is ProfileUiState.Editing) {
            _uiState.value = current.copy(firstName = value, error = null)
        }
    }

    fun updateLastName(value: String) {
        val current = _uiState.value
        if (current is ProfileUiState.Editing) {
            _uiState.value = current.copy(lastName = value, error = null)
        }
    }

    fun updateEmail(value: String) {
        val current = _uiState.value
        if (current is ProfileUiState.Editing) {
            _uiState.value = current.copy(email = value, error = null)
        }
    }

    fun saveProfile() {
        val current = _uiState.value
        if (current !is ProfileUiState.Editing) return

        if (current.firstName.isBlank() || current.lastName.isBlank()) {
            _uiState.value = current.copy(error = "Le nom et le prénom sont obligatoires")
            return
        }

        viewModelScope.launch {
            _uiState.value = current.copy(isSaving = true, error = null)

            val emailToSend = if (current.email != current.originalEmail) current.email else null

            when (val res = updateProfileUseCase(current.firstName, current.lastName, emailToSend)) {
                is UpdateProfileUseCaseResult.Success -> {
                    _uiState.value = ProfileUiState.Saved(emailChanged = res.emailChanged)
                }
                is UpdateProfileUseCaseResult.Error -> {
                    _uiState.value = current.copy(isSaving = false, error = res.message)
                }
            }
        }
    }

    fun cancelEditing() {
        loadUserInfo()
    }

    fun onSavedAcknowledged() {
        loadUserInfo()
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
